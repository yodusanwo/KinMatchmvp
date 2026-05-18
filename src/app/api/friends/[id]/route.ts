import { createClient } from "@/lib/supabase/server";
import type { FriendProfile } from "@/lib/api/types";
import {
  cadenceLabel,
  daysQuiet,
  isDrifting,
  vibeLabel,
  type FriendRow,
} from "@/lib/friends/utils";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: friend, error: friendError } = await supabase
    .from("friends")
    .select(
      "id, name, avatar_color, vibe, cadence_days, last_touch_at, created_at, where_met, is_wished_closer"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (friendError) {
    return NextResponse.json({ error: friendError.message }, { status: 500 });
  }

  if (!friend) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [memoriesRes, interestsRes, ritualsRes, interactionsRes] =
    await Promise.all([
      supabase
        .from("memory_notes")
        .select("id, text, tag, event_date, created_at")
        .eq("friend_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("shared_interests")
        .select("id, label")
        .eq("friend_id", id)
        .order("label"),
      supabase
        .from("rituals")
        .select("id, label, cadence, streak_count, last_occurred_at")
        .eq("friend_id", id)
        .order("label"),
      supabase
        .from("interactions")
        .select("id, type, occurred_at, notes")
        .eq("friend_id", id)
        .order("occurred_at", { ascending: false })
        .limit(5),
    ]);

  const row = friend as FriendRow & {
    where_met: string | null;
    is_wished_closer: boolean;
  };
  const quiet = daysQuiet(row);

  const profile: FriendProfile = {
    id: row.id,
    name: row.name,
    avatar_color: row.avatar_color,
    vibe: row.vibe,
    cadence_days: row.cadence_days,
    days_quiet: quiet,
    is_drifting: isDrifting(row),
    last_touch_at: row.last_touch_at,
    where_met: row.where_met,
    is_wished_closer: row.is_wished_closer,
    cadence_label: cadenceLabel(row.cadence_days),
    vibe_label: vibeLabel(row.vibe),
    memories: memoriesRes.data ?? [],
    shared_interests: interestsRes.data ?? [],
    rituals: ritualsRes.data ?? [],
    interactions: interactionsRes.data ?? [],
  };

  return NextResponse.json(profile);
}
