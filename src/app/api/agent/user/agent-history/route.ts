/**
 * GET /api/agent/user/agent-history?days=14
 *
 * Returns the agent's past decisions for this user within the time window.
 *
 * Used by the agent to:
 *   - Avoid repeating itself
 *   - Respect frequency caps (max 2 nudges/week, 4-day min gap)
 *   - Show product analytics about agent behavior
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") && authHeader.length > "Bearer ".length
      ? authHeader.slice("Bearer ".length).trim()
      : null;

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

  const daysParam = req.nextUrl.searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 14;

  if (isNaN(days) || days < 1 || days > 365) {
    return NextResponse.json(
      { error: "days must be between 1 and 365" },
      { status: 400 },
    );
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: decisions, error: decisionsError } = await supabase
    .from("agent_decisions")
    .select(
      "id, decision_type, reasoning, friend_id, message, ritual_name, calendar_link, created_at",
    )
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (decisionsError) {
    console.error("[agent-user-agent-history] Query failed:", decisionsError);
    return NextResponse.json(
      { error: decisionsError.message },
      { status: 500 },
    );
  }

  const allDecisions = decisions ?? [];

  const nudgesSent = allDecisions.filter(
    (d) =>
      d.decision_type === "nudge_sent" ||
      d.decision_type === "ritual_suggested",
  );

  const mostRecentNudge = nudgesSent[0] ?? null;

  return NextResponse.json({
    days_window: days,
    decisions: allDecisions.map((d) => ({
      decision_id: d.id,
      decision_type: d.decision_type,
      reasoning: d.reasoning,
      friend_id: d.friend_id,
      ritual_name: d.ritual_name,
      run_at: d.created_at,
    })),
    nudges_in_window: nudgesSent.length,
    most_recent_nudge: mostRecentNudge
      ? {
          run_at: mostRecentNudge.created_at,
          decision_type: mostRecentNudge.decision_type,
          friend_id: mostRecentNudge.friend_id,
        }
      : null,
  });
}
