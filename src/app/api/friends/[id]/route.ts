import { createClient } from "@/lib/supabase/server";
import type { FriendProfile, FriendProfilePrompt } from "@/lib/api/types";
import { mapMemoryNoteRow } from "@/lib/memories/map-note";
import {
  cadenceLabel,
  daysQuiet,
  isDrifting,
  normalizedCategory,
  type FriendRow,
} from "@/lib/friends/utils";
import { categoryRelationshipLabel } from "@/lib/friends/categories";
import { isPaletteColor } from "@/lib/friends/avatar-colors";
import { formatPersonName } from "@/lib/names/format";
import {
  isLikelyInvalidPhone,
  normalizePhone,
} from "@/lib/phones/normalize";
import { buildTodayState } from "@/lib/today/get-daily-state";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function profilePromptForFriend(params: {
  friend: FriendRow;
  daysQuiet: number;
  hasHistory: boolean;
  dailyState: Awaited<ReturnType<typeof buildTodayState>>["dailyState"];
}): FriendProfilePrompt {
  const { friend, daysQuiet, hasHistory, dailyState } = params;
  const isTodaysSpotlight = dailyState?.friend.id === friend.id;
  const name = firstName(friend.name);

  if (isTodaysSpotlight && dailyState) {
    if (dailyState.kind === "send_discovery") {
      return {
        kind: "send",
        quote: dailyState.prompt.question,
        why_this_works: dailyState.prompt.why_it_works,
        cta_label: "Send a voice note",
        cta_href: `/api/discovery/outreach?friend_id=${friend.id}&day=${dailyState.day_number}`,
      };
    }

    if (dailyState.kind === "send_algorithmic") {
      return {
        kind: "send",
        quote: dailyState.personalized_prompt,
        why_this_works: dailyState.primary_reason,
        cta_label: "Send a voice note",
        cta_href: `/friends/${friend.id}/voice-note`,
      };
    }

    return {
      kind: "capture",
      quote: `You asked: "${dailyState.original_question}"`,
      prompt: `What did ${name} say? Type or voice-note what you learned.`,
      cta_label: `Save to ${name}'s profile →`,
      cta_href: `/capture/${dailyState.voice_note.id}`,
    };
  }

  if (hasHistory) {
    return {
      kind: "send",
      quote:
        daysQuiet <= 0
          ? `You reached out to ${name} today.`
          : `It's been ${daysQuiet} ${daysQuiet === 1 ? "day" : "days"} since you reached out to ${name}.`,
      why_this_works: null,
      cta_label: "Send a voice note",
      cta_href: `/friends/${friend.id}/voice-note`,
    };
  }

  return {
    kind: "send",
    quote: `KinMatch learns about ${name} from the conversations we capture. Send them a voice note, their profile will fill in as you go.`,
    why_this_works: null,
    cta_label: "Send a voice note",
    cta_href: `/friends/${friend.id}/voice-note`,
  };
}

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
      "id, name, avatar_color, avatar_color_hex, vibe, category, cadence_days, last_touch_at, created_at, where_met, phone_number, is_wished_closer, archived_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (friendError) {
    return NextResponse.json({ error: friendError.message }, { status: 500 });
  }

  if (!friend) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [memoriesRes, interestsRes, ritualsRes, interactionsRes, profileRes] =
    await Promise.all([
      supabase
        .from("memory_notes")
        .select(
          "id, friend_id, text, tag, event_date, source, created_at, last_surfaced_at"
        )
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
      supabase
        .from("users")
        .select("id, barriers, discovery_started_at, discovery_completed_at")
        .eq("id", user.id)
        .single(),
    ]);

  const row = friend as FriendRow & {
    where_met: string | null;
    phone_number: string | null;
    is_wished_closer: boolean;
  };
  const quiet = daysQuiet(row);
  const category = normalizedCategory(row.category);
  const { dailyState } = await buildTodayState({
    supabase,
    user: {
      id: user.id,
      barriers: (profileRes.data?.barriers ?? []) as string[],
      discovery_started_at: profileRes.data?.discovery_started_at,
      discovery_completed_at: profileRes.data?.discovery_completed_at,
    },
  });
  const hasHistory = (interactionsRes.data ?? []).length > 0;

  const profile: FriendProfile = {
    id: row.id,
    name: formatPersonName(row.name),
    avatar_color: row.avatar_color,
    avatar_color_hex: row.avatar_color_hex ?? null,
    vibe: row.vibe,
    category,
    cadence_days: row.cadence_days,
    days_quiet: quiet,
    is_drifting: isDrifting(row),
    last_touch_at: row.last_touch_at,
    where_met: row.where_met,
    phone_number: row.phone_number,
    is_wished_closer: row.is_wished_closer,
    cadence_label: cadenceLabel(row.cadence_days),
    vibe_label: categoryRelationshipLabel(category),
    archived_at: row.archived_at ?? null,
    memories: (memoriesRes.data ?? []).map(mapMemoryNoteRow),
    shared_interests: interestsRes.data ?? [],
    rituals: ritualsRes.data ?? [],
    interactions: interactionsRes.data ?? [],
    profile_prompt: profilePromptForFriend({
      friend: row,
      daysQuiet: quiet,
      hasHistory,
      dailyState,
    }),
  };

  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { phone_number?: unknown; avatar_color_hex?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: { phone_number?: string | null; avatar_color_hex?: string | null } =
    {};

  if ("phone_number" in body) {
    let phoneNumber: string | null = null;
    const raw = body.phone_number;
    if (raw !== null && raw !== "") {
      if (typeof raw !== "string") {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      if (isLikelyInvalidPhone(raw)) {
        return NextResponse.json(
          { error: "That doesn't look like a phone number, try with area code." },
          { status: 400 }
        );
      }
      phoneNumber = normalizePhone(raw);
    }
    updates.phone_number = phoneNumber;
  }

  if ("avatar_color_hex" in body) {
    const raw = body.avatar_color_hex;
    if (raw === null || raw === "") {
      updates.avatar_color_hex = null; // reset to the auto color
    } else if (typeof raw === "string" && isPaletteColor(raw)) {
      updates.avatar_color_hex = raw;
    } else {
      return NextResponse.json(
        { error: "Pick one of the available colors." },
        { status: 400 }
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("friends")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .select("id, phone_number, avatar_color_hex")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    phone_number: data.phone_number,
    avatar_color_hex: data.avatar_color_hex,
  });
}
