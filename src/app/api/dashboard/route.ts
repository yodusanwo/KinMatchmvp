import { createClient } from "@/lib/supabase/server";
import type { DashboardResponse, FriendSummary } from "@/lib/api/types";
import { NextResponse } from "next/server";
import { daysQuiet, isDrifting } from "@/lib/friends/utils";
import { formatPersonName } from "@/lib/names/format";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user profile for name
  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  const firstName = profile?.name ? formatPersonName(profile.name).split(/\s+/)[0] : "there";

  // Fetch all tribe members with their stats
  const { data: friendsData, error: friendsError } = await supabase
    .from("friends")
    .select(
      `
      id,
      name,
      avatar_color,
      avatar_color_hex,
      avatar_initials,
      vibe,
      category,
      cadence_days,
      last_touch_at,
      created_at,
      archived_at
      `
    )
    .eq("user_id", user.id)
    .eq("in_tribe", true)
    .is("archived_at", null)
    .order("name");

  if (friendsError || !friendsData) {
    return NextResponse.json(
      { error: friendsError?.message ?? "Failed to fetch friends" },
      { status: 500 }
    );
  }

  // Transform to FriendSummary with calculated fields
  const friends: FriendSummary[] = friendsData.map((friend) => {
    const quiet = daysQuiet(friend);
    return {
      id: friend.id,
      name: formatPersonName(friend.name),
      avatar_color: friend.avatar_color,
      avatar_color_hex: friend.avatar_color_hex ?? null,
      avatar_initials: friend.avatar_initials ?? null,
      vibe: friend.vibe,
      category: friend.category ?? "inner_circle",
      cadence_days: friend.cadence_days,
      days_quiet: quiet,
      is_drifting: isDrifting(friend),
      last_touch_at: friend.last_touch_at,
      archived_at: friend.archived_at,
    };
  });

  // Filter core tribe (inner_circle and family)
  const coreTribe = friends.filter(
    (f) => f.category === "inner_circle" || f.category === "family"
  );

  // Calculate friendship momentum
  const growing = friends.filter(
    (f) => f.days_quiet < 7 && f.days_quiet < f.cadence_days * 0.5
  );
  const stable = friends.filter((f) => !f.is_drifting && f.days_quiet >= 7);
  const needsAttention = friends.filter((f) => f.is_drifting);

  // Calculate insights - last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Count unique friends reached out to
  const { data: recentInteractions } = await supabase
    .from("interactions")
    .select("friend_id")
    .eq("user_id", user.id)
    .gte("occurred_at", sevenDaysAgo.toISOString());

  const uniqueFriendsReachedOut = new Set(
    (recentInteractions ?? []).map((i) => i.friend_id)
  ).size;

  // Count voice notes sent
  const { data: recentVoiceNotes } = await supabase
    .from("voice_notes")
    .select("id")
    .eq("sender_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString());

  const weeklyVoiceNotes = recentVoiceNotes?.length ?? 0;

  return NextResponse.json({
    user: {
      firstName,
    },
    coreTribe,
    momentum: {
      growing,
      stable,
      needsAttention,
    },
    insights: {
      weeklyReachOuts: uniqueFriendsReachedOut,
      weeklyVoiceNotes,
    },
  } satisfies DashboardResponse);
}
