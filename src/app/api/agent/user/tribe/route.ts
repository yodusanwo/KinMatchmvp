/**
 * GET /api/agent/user/tribe
 *
 * Returns the authenticated user's active friends with the data needed for
 * relational care decisions, including memory_notes (emotional context) for
 * each friend.
 *
 * Authentication: Bearer token (agent) or cookies (browser).
 * RLS enforces user_id = auth.uid().
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

  // Fetch friends
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

  const friendIds = (friends ?? []).map((f) => f.id);

  // Fetch memory notes for all friends in one query
  const { data: memoryNotes, error: notesError } =
    friendIds.length > 0
      ? await supabase
          .from("memory_notes")
          .select("id, friend_id, text, tag, event_date, created_at")
          .in("friend_id", friendIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (notesError) {
    console.error("[agent-user-tribe] Memory notes query failed:", notesError);
    // Don't fail the whole request — just return without notes
  }

  // Group notes by friend_id
  const notesByFriend = new Map<
    string,
    Array<{
      text: string;
      tag: string | null;
      event_date: string | null;
      created_at: string;
    }>
  >();

  for (const note of memoryNotes ?? []) {
    if (!notesByFriend.has(note.friend_id)) {
      notesByFriend.set(note.friend_id, []);
    }
    notesByFriend.get(note.friend_id)!.push({
      text: note.text,
      tag: note.tag,
      event_date: note.event_date,
      created_at: note.created_at,
    });
  }

  // Compute days_quiet and enrich each friend with their notes
  const now = Date.now();
  const enrichedFriends = (friends ?? []).map((friend) => {
    const daysQuiet = friend.last_touch_at
      ? Math.floor(
          (now - new Date(friend.last_touch_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const friendNotes = notesByFriend.get(friend.id) ?? [];

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
      // Notes: emotional context the user has captured about this friend.
      // Most recent first. Agent uses these for tone-aware decisions.
      notes: friendNotes,
      notes_count: friendNotes.length,
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
