/**
 * GET /api/agent/user/activity?days=7
 *
 * Returns the user's recent outreach activity — voice notes sent and
 * interactions logged within the time window.
 *
 * Used by the agent to determine if the user is "already connecting" with
 * their tribe (which triggers no_action_needed) or if they're inactive
 * (which means a nudge may be helpful).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  // Resolve auth
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

  // Parse days parameter
  const searchParams = req.nextUrl.searchParams;
  const daysParam = searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 7;

  if (isNaN(days) || days < 1 || days > 90) {
    return NextResponse.json(
      { error: "days must be between 1 and 90" },
      { status: 400 },
    );
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Fetch the user's friends to know inner_circle status (needed for the agent's rules)
  const { data: friends } = await supabase
    .from("friends")
    .select("id, category")
    .eq("user_id", user.id)
    .is("archived_at", null);

  const innerCircleIds = new Set(
    (friends ?? [])
      .filter((f) => f.category === "inner_circle")
      .map((f) => f.id),
  );

  // Fetch interactions in window
  const { data: interactions, error: interactionsError } = await supabase
    .from("interactions")
    .select("id, friend_id, mode, occurred_at")
    .eq("user_id", user.id)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false });

  if (interactionsError) {
    console.error(
      "[agent-user-activity] Interactions query failed:",
      interactionsError,
    );
    return NextResponse.json(
      { error: interactionsError.message },
      { status: 500 },
    );
  }

  const allInteractions = interactions ?? [];

  // Voice notes specifically (mode = "voice_note")
  const voiceNotes = allInteractions.filter((i) => i.mode === "voice_note");

  const voiceNotesToInnerCircle = voiceNotes.filter((vn) =>
    innerCircleIds.has(vn.friend_id),
  );

  return NextResponse.json({
    days_window: days,
    voice_notes_sent: voiceNotes.map((vn) => ({
      friend_id: vn.friend_id,
      sent_at: vn.occurred_at,
    })),
    voice_notes_to_inner_circle_count: voiceNotesToInnerCircle.length,
    total_interactions: allInteractions.length,
    interactions_by_mode: countByMode(allInteractions),
  });
}

function countByMode(interactions: Array<{ mode: string | null }>) {
  const counts: Record<string, number> = {};
  for (const i of interactions) {
    const mode = i.mode ?? "unknown";
    counts[mode] = (counts[mode] ?? 0) + 1;
  }
  return counts;
}
