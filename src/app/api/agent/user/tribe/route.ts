/**
 * GET /api/agent/user/tribe
 *
 * Returns the authenticated user's active friends with the data needed for
 * relational care decisions, including:
 *   - Memory notes (emotional context)
 *   - Voice note engagement statistics (listen signals)
 *
 * Listen signals enable the agent to reason about WHETHER friends engaged
 * with the voice notes the user sent, not just WHEN they were sent.
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
  }

  // Fetch voice note engagement stats per friend
  // We query voice_notes where the friend is the recipient
  const { data: voiceNotes, error: voiceNotesError } =
    friendIds.length > 0
      ? await supabase
          .from("voice_notes")
          .select("friend_id, listened_at, listen_count, created_at")
          .in("friend_id", friendIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (voiceNotesError) {
    console.error(
      "[agent-user-tribe] Voice notes query failed:",
      voiceNotesError,
    );
    // Don't fail the whole request, listen stats are enrichment
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

  // Compute listen stats per friend
  const listenStatsByFriend = new Map<
    string,
    {
      total_voice_notes_sent_count: number;
      voice_notes_listened_count: number;
      last_voice_note_sent_at: string | null;
      last_voice_note_listened_at: string | null;
      engagement_status: "engaged" | "no_engagement" | "no_data";
    }
  >();

  // Pre-initialize all friends with empty stats
  for (const friendId of friendIds) {
    listenStatsByFriend.set(friendId, {
      total_voice_notes_sent_count: 0,
      voice_notes_listened_count: 0,
      last_voice_note_sent_at: null,
      last_voice_note_listened_at: null,
      engagement_status: "no_data",
    });
  }

  // Aggregate voice note data per friend
  for (const vn of voiceNotes ?? []) {
    const stats = listenStatsByFriend.get(vn.friend_id);
    if (!stats) continue;

    stats.total_voice_notes_sent_count += 1;

    if (vn.listened_at) {
      stats.voice_notes_listened_count += 1;
    }

    // Track most recent sent timestamp
    if (
      vn.created_at &&
      (!stats.last_voice_note_sent_at ||
        vn.created_at > stats.last_voice_note_sent_at)
    ) {
      stats.last_voice_note_sent_at = vn.created_at;
    }

    // Track most recent listened timestamp
    if (
      vn.listened_at &&
      (!stats.last_voice_note_listened_at ||
        vn.listened_at > stats.last_voice_note_listened_at)
    ) {
      stats.last_voice_note_listened_at = vn.listened_at;
    }
  }

  // Compute engagement_status based on aggregated data
  for (const [friendId, stats] of listenStatsByFriend.entries()) {
    if (stats.total_voice_notes_sent_count === 0) {
      stats.engagement_status = "no_data";
    } else if (stats.voice_notes_listened_count > 0) {
      stats.engagement_status = "engaged";
    } else {
      stats.engagement_status = "no_engagement";
    }
  }

  // Compute days_quiet and enrich each friend
  const now = Date.now();
  const enrichedFriends = (friends ?? []).map((friend) => {
    const daysQuiet = friend.last_touch_at
      ? Math.floor(
          (now - new Date(friend.last_touch_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const friendNotes = notesByFriend.get(friend.id) ?? [];
    const friendListenStats = listenStatsByFriend.get(friend.id) ?? {
      total_voice_notes_sent_count: 0,
      voice_notes_listened_count: 0,
      last_voice_note_sent_at: null,
      last_voice_note_listened_at: null,
      engagement_status: "no_data" as const,
    };

    // Compute days_since_listen (helpful derived field)
    const daysSinceLisen = friendListenStats.last_voice_note_listened_at
      ? Math.floor(
          (now -
            new Date(friendListenStats.last_voice_note_listened_at).getTime()) /
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
      // Memory notes: emotional context
      notes: friendNotes,
      notes_count: friendNotes.length,
      // Listen signals: engagement data
      engagement: {
        total_voice_notes_sent: friendListenStats.total_voice_notes_sent_count,
        voice_notes_listened: friendListenStats.voice_notes_listened_count,
        last_voice_note_sent_at: friendListenStats.last_voice_note_sent_at,
        last_voice_note_listened_at:
          friendListenStats.last_voice_note_listened_at,
        days_since_listen: daysSinceLisen,
        status: friendListenStats.engagement_status,
      },
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
