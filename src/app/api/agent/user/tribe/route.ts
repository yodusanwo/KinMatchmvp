/**
 * GET /api/agent/user/tribe
 *
 * Returns the authenticated user's active friends (their "tribe") with the
 * data needed for relational care decisions.
 *
 * Includes:
 *   - Basic friend identity (id, name, phone, avatar_color)
 *   - Relationship metadata (category, vibe, cadence_days)
 *   - Activity timing (last_touch_at, days_quiet computed)
 *   - User notes about the friend (for emotional context)
 *
 * Authentication: Bearer token (agent) or cookies (browser).
 * RLS enforces user_id = auth.uid().
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // Resolve authentication
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // Fetch friends
  // ─────────────────────────────────────────────────────────────

  const { data: friends, error: friendsError } = await supabase
    .from("friends")
    .select(
      "id, name, phone_number, avatar_color, vibe, category, cadence_days, last_touch_at, created_at, in_tribe, is_wished_closer",
    )
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("last_touch_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (friendsError) {
    console.error("[agent-user-tribe] Friends query failed:", friendsError);
    return NextResponse.json({ error: friendsError.message }, { status: 500 });
  }

  // ─────────────────────────────────────────────────────────────
  // Compute days_quiet for each friend + summarize counts
  // ─────────────────────────────────────────────────────────────

  const now = Date.now();
  const enrichedFriends = (friends ?? []).map((friend) => {
    const daysQuiet = friend.last_touch_at
      ? Math.floor(
          (now - new Date(friend.last_touch_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      friend_id: friend.id,
      name: friend.name,
      phone_number: friend.phone_number,
      avatar_color: friend.avatar_color,
      vibe: friend.vibe,
      category: friend.category ?? "inner_circle",
      cadence_days: friend.cadence_days,
      last_touch_at: friend.last_touch_at,
      days_quiet: daysQuiet,
      in_tribe: friend.in_tribe,
      is_wished_closer: friend.is_wished_closer,
    };
  });

  return NextResponse.json({
    friends: enrichedFriends,
    count: enrichedFriends.length,
    inner_circle_count: enrichedFriends.filter(
      (f) => f.category === "inner_circle",
    ).length,
    village_count: enrichedFriends.filter((f) => f.category === "village")
      .length,
    acquaintance_count: enrichedFriends.filter(
      (f) => f.category === "acquaintance",
    ).length,
  });
}
