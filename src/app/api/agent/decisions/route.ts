/**
 * POST /api/agent/decisions
 *
 * Records a decision made by the KinMatch Relational Care Agent.
 *
 * Authentication supports BOTH:
 *   - Browser cookies (real user sessions via magic link)
 *   - Authorization: Bearer header (agent with minted JWT)
 *
 * Either way, the resulting Supabase client is scoped to one user.
 * RLS policies enforce that decisions can only be inserted for the
 * authenticated user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const VALID_DECISION_TYPES = [
  "nudge_sent",
  "ritual_suggested",
  "no_action_needed",
  "no_eligible_friends",
  "frequency_cap_reached",
  "error",
] as const;

type DecisionType = (typeof VALID_DECISION_TYPES)[number];

interface DecisionBody {
  decision_type?: unknown;
  reasoning?: unknown;
  friend_id?: unknown;
  message?: unknown;
  ritual_name?: unknown;
  calendar_link?: unknown;
}

export async function POST(req: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // Resolve authentication, either bearer token or cookie session
  // ─────────────────────────────────────────────────────────────

  const authHeader = req.headers.get("authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") && authHeader.length > "Bearer ".length
      ? authHeader.slice("Bearer ".length).trim()
      : null;

  // Pick the right Supabase client based on how the request is authenticated
  const supabase = bearerToken
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${bearerToken}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        },
      )
    : await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ─────────────────────────────────────────────────────────────
  // Parse and validate request body
  // ─────────────────────────────────────────────────────────────

  let body: DecisionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body.decision_type !== "string" ||
    !VALID_DECISION_TYPES.includes(body.decision_type as DecisionType)
  ) {
    return NextResponse.json(
      {
        error: `decision_type must be one of: ${VALID_DECISION_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (
    typeof body.reasoning !== "string" ||
    body.reasoning.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "reasoning is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  if (body.reasoning.length > 2000) {
    return NextResponse.json(
      { error: "reasoning must be 2000 characters or less" },
      { status: 400 },
    );
  }

  const friendId =
    typeof body.friend_id === "string" && body.friend_id.length > 0
      ? body.friend_id
      : null;

  const message =
    typeof body.message === "string" && body.message.length > 0
      ? body.message
      : null;

  if (message && message.length > 5000) {
    return NextResponse.json(
      { error: "message must be 5000 characters or less" },
      { status: 400 },
    );
  }

  const ritualName =
    typeof body.ritual_name === "string" && body.ritual_name.length > 0
      ? body.ritual_name
      : null;

  const calendarLink =
    typeof body.calendar_link === "string" && body.calendar_link.length > 0
      ? body.calendar_link
      : null;

  // ─────────────────────────────────────────────────────────────
  // Insert the decision
  // user_id is set from the authenticated session, not from the body.
  // RLS enforces auth.uid() = user_id at the database level.
  // ─────────────────────────────────────────────────────────────

  const { data: decision, error: insertError } = await supabase
    .from("agent_decisions")
    .insert({
      user_id: user.id,
      decision_type: body.decision_type as DecisionType,
      reasoning: body.reasoning.trim(),
      friend_id: friendId,
      message: message,
      ritual_name: ritualName,
      calendar_link: calendarLink,
    })
    .select("id, decision_type, created_at")
    .single();

  if (insertError || !decision) {
    console.error("[agent-decisions] Insert failed:", insertError);
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to record decision" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: decision.id,
      decision_type: decision.decision_type,
      created_at: decision.created_at,
    },
    { status: 201 },
  );
}
