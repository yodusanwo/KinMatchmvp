import { createClient } from "@/lib/supabase/server";
import type { TodayResponse } from "@/lib/api/types";
import {
  daysQuiet,
  defaultSpotlightPrompt,
  isDrifting,
  type FriendRow,
} from "@/lib/friends/utils";
import { todayDateString } from "@/lib/today/format";
import { NextResponse } from "next/server";

function toSummary(friend: FriendRow) {
  const quiet = daysQuiet(friend);
  return {
    id: friend.id,
    name: friend.name,
    avatar_color: friend.avatar_color,
    vibe: friend.vibe,
    cadence_days: friend.cadence_days,
    days_quiet: quiet,
    is_drifting: isDrifting(friend),
    last_touch_at: friend.last_touch_at,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: friends, error: friendsError } = await supabase
    .from("friends")
    .select(
      "id, name, avatar_color, vibe, cadence_days, last_touch_at, created_at"
    )
    .eq("user_id", user.id)
    .eq("in_tribe", true)
    .is("archived_at", null)
    .order("name");

  if (friendsError) {
    return NextResponse.json({ error: friendsError.message }, { status: 500 });
  }

  const tribe = (friends ?? []).map((f) => toSummary(f as FriendRow));
  const today = todayDateString();

  const { data: spotlightRow } = await supabase
    .from("today_spotlights")
    .select("friend_id, prompt_text, suggested_action")
    .eq("user_id", user.id)
    .eq("generated_for_date", today)
    .maybeSingle();

  let spotlight: TodayResponse["spotlight"] = null;

  if (spotlightRow) {
    const match = tribe.find((t) => t.id === spotlightRow.friend_id);
    if (match) {
      spotlight = {
        friend_id: match.id,
        name: match.name,
        avatar_color: match.avatar_color,
        days_quiet: match.days_quiet,
        prompt_text: spotlightRow.prompt_text,
        suggested_action: spotlightRow.suggested_action,
      };
    }
  }

  if (!spotlight && tribe.length > 0) {
    const top = [...tribe].sort((a, b) => b.days_quiet - a.days_quiet)[0];
    spotlight = {
      friend_id: top.id,
      name: top.name,
      avatar_color: top.avatar_color,
      days_quiet: top.days_quiet,
      prompt_text: defaultSpotlightPrompt(top.name, top.days_quiet),
      suggested_action: "voice_note",
    };
  }

  const orderedTribe = [...tribe].sort((a, b) => b.days_quiet - a.days_quiet);

  return NextResponse.json({
    spotlight,
    tribe: orderedTribe,
  } satisfies TodayResponse);
}
