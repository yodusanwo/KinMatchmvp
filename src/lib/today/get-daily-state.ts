import { createClient } from "@/lib/supabase/server";
import type {
  FriendSummary,
  TodayDailyState,
  TodayUpNext,
} from "@/lib/api/types";
import { mapMemoryNoteRow } from "@/lib/memories/map-note";
import {
  daysQuiet,
  isDrifting,
  normalizedCategory,
  type FriendRow,
} from "@/lib/friends/utils";
import { formatPersonName } from "@/lib/names/format";
import { formatPersonalizedSpotlightPrompt, isBarrierKey } from "@/lib/personalization";
import type { BarrierKey } from "@/lib/personalization";
import { rankFriendsForToday } from "@/lib/algorithm/spotlight-ranking";
import type {
  Friend,
  FriendScore,
  Touchpoint,
  User as AlgorithmUser,
} from "@/lib/algorithm/types";
import {
  getDiscoveryPromptForDay,
  renderDiscoveryQuestion,
} from "@/lib/discovery/prompt-library";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type User = {
  id: string;
  barriers?: string[] | null;
  discovery_started_at?: string | null;
  discovery_completed_at?: string | null;
};

type MemoryNoteRow = {
  id: string;
  friend_id?: string;
  text: string;
  tag: string;
  event_date?: string | null;
  source?: string;
  created_at: string;
  last_surfaced_at?: string | null;
};

type InteractionRow = {
  id: string;
  occurred_at: string;
  direction?: "outbound" | "inbound" | null;
};

type FriendContextRow = FriendRow & {
  last_spotlight_at?: string | null;
  memory_notes?: MemoryNoteRow[] | null;
  interactions?: InteractionRow[] | null;
};

type PendingCaptureRow = {
  id: string;
  friend_id: string | null;
  recipient_friend_id: string | null;
  created_at: string;
  duration_seconds: number;
  friends:
    | (FriendRow & {
        archived_at?: string | null;
      })
    | (FriendRow & {
        archived_at?: string | null;
      })[]
    | null;
  discovery_prompts:
    | {
        question: string | null;
        prompt_day: number | null;
        prompt_cycle: number | null;
      }
    | {
        question: string | null;
        prompt_day: number | null;
        prompt_cycle: number | null;
      }[]
    | null;
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function daysBetween(start: string, end: Date): number {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return 0;
  const diff = end.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function toSummary(friend: FriendContextRow | FriendRow): FriendSummary {
  const quiet = daysQuiet(friend);
  return {
    id: friend.id,
    name: formatPersonName(friend.name),
    avatar_color: friend.avatar_color,
    vibe: friend.vibe,
    category: normalizedCategory(friend.category),
    cadence_days: friend.cadence_days,
    days_quiet: quiet,
    is_drifting: isDrifting(friend),
    last_touch_at: friend.last_touch_at,
    archived_at: friend.archived_at ?? null,
  };
}

function latestTouchpointAt(
  touchpoints: Touchpoint[],
  direction: "outbound" | "inbound"
): string | null {
  let latest: string | null = null;
  for (const touchpoint of touchpoints) {
    if ((touchpoint.direction ?? "outbound") !== direction || !touchpoint.occurred_at) {
      continue;
    }
    const value = new Date(touchpoint.occurred_at).toISOString();
    if (!latest || new Date(value) > new Date(latest)) latest = value;
  }
  return latest;
}

function toAlgorithmFriend(friend: FriendContextRow): Friend {
  const touchpoints: Touchpoint[] = (friend.interactions ?? []).map((interaction) => ({
    id: interaction.id,
    direction: interaction.direction ?? "outbound",
    occurred_at: interaction.occurred_at,
  }));
  const memoryNotes = (friend.memory_notes ?? []).map((note) =>
    mapMemoryNoteRow(note)
  );

  return {
    id: friend.id,
    name: formatPersonName(friend.name),
    avatar_color: friend.avatar_color,
    vibe: friend.vibe,
    category: normalizedCategory(friend.category),
    created_at: friend.created_at,
    last_contact_at: friend.last_touch_at,
    last_touch_at: friend.last_touch_at,
    intended_cadence_days: friend.cadence_days,
    cadence_days: friend.cadence_days,
    is_wished_closer: friend.is_wished_closer ?? false,
    last_spotlight_at: friend.last_spotlight_at ?? null,
    last_inbound_touch_at: latestTouchpointAt(touchpoints, "inbound"),
    last_outbound_touch_at:
      latestTouchpointAt(touchpoints, "outbound") ?? friend.last_touch_at,
    memory_notes: memoryNotes,
    touchpoints,
  };
}

function toUpNext(
  score: FriendScore,
  summary: FriendSummary,
  barriers: BarrierKey[]
): TodayUpNext {
  return {
    friend_id: summary.id,
    name: summary.name,
    avatar_color: summary.avatar_color,
    days_quiet: summary.days_quiet,
    prompt_text: formatPersonalizedSpotlightPrompt(
      { barriers },
      summary.name,
      summary.days_quiet
    ),
    suggested_action: "voice_note",
    total_score: score.total_score,
    component_scores: score.components,
    primary_reason: score.primary_reason,
  };
}

async function loadFriendContext(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      id,
      name,
      avatar_color,
      vibe,
      category,
      cadence_days,
      last_touch_at,
      last_spotlight_at,
      is_wished_closer,
      created_at,
      memory_notes(id, friend_id, text, tag, event_date, source, created_at, last_surfaced_at),
      interactions(id, occurred_at, direction)
      `
    )
    .eq("user_id", userId)
    .eq("in_tribe", true)
    .is("archived_at", null)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as FriendContextRow[];
}

async function getPendingCapture(
  supabase: Supabase,
  user: User
): Promise<TodayDailyState | null> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("voice_notes")
    .select(
      `
      id,
      friend_id,
      recipient_friend_id,
      created_at,
      duration_seconds,
      friends:friends!voice_notes_friend_id_fkey(id, name, avatar_color, vibe, cadence_days, last_touch_at, created_at, is_wished_closer, archived_at),
      discovery_prompts(question, prompt_day, prompt_cycle)
      `
    )
    .eq("sender_id", user.id)
    .eq("capture_pending", true)
    .eq("capture_abandoned", false)
    .lte("created_at", cutoff)
    .or(`capture_deferred_until.is.null,capture_deferred_until.lt.${now.toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);
  const row = ((data ?? [])[0] ?? null) as PendingCaptureRow | null;
  if (!row) return null;

  const friend = firstOrNull(row.friends);
  if (!friend || friend.archived_at) return null;

  const prompt = firstOrNull(row.discovery_prompts);
  const dayNumber = prompt?.prompt_day ?? undefined;
  const cycleNumber = prompt?.prompt_cycle ?? (dayNumber ? Math.ceil(dayNumber / 2) : undefined);

  return {
    kind: "capture",
    friend: toSummary(friend),
    voice_note: {
      id: row.id,
      created_at: row.created_at,
      duration_seconds: row.duration_seconds,
    },
    original_question: prompt?.question ?? "",
    day_number: dayNumber ? dayNumber + 1 : undefined,
    cycle_number: cycleNumber,
  };
}

export async function getDailyState(params: {
  supabase: Supabase;
  user: User;
  friends: FriendContextRow[];
  ranked: FriendScore[];
  summaries: Map<string, FriendSummary>;
  barriers: BarrierKey[];
}): Promise<TodayDailyState | null> {
  const pendingCapture = await getPendingCapture(params.supabase, params.user);
  if (pendingCapture) return pendingCapture;

  const { user, friends, ranked, summaries, barriers } = params;
  if (
    user.discovery_started_at &&
    !user.discovery_completed_at
  ) {
    const dayNumber = daysBetween(user.discovery_started_at, new Date()) + 1;
    if (dayNumber <= 10 && dayNumber % 2 === 1) {
      const cycleNumber = Math.ceil(dayNumber / 2);
      const prompt = getDiscoveryPromptForDay(dayNumber);
      const ordered = ranked
        .map((score) => summaries.get(score.friend_id))
        .filter((summary): summary is FriendSummary => Boolean(summary));

      // Get friends who already have a prompt for this day number (sent or skipped)
      const { data: existingPrompts } = await params.supabase
        .from("discovery_prompts")
        .select("friend_id")
        .eq("user_id", user.id)
        .eq("prompt_day", dayNumber);

      const promptedFriendIds = new Set(
        (existingPrompts ?? []).map((p) => p.friend_id)
      );

      // Filter out friends who already have prompts for today
      const availableFriends = ordered.filter(
        (friend) => !promptedFriendIds.has(friend.id)
      );

      // Pick the first available friend
      const friend = availableFriends[0] ?? null;

      if (prompt && friend) {
        return {
          kind: "send_discovery",
          friend,
          day_number: dayNumber,
          cycle_number: cycleNumber,
          prompt: {
            cycle: prompt.cycle,
            question: renderDiscoveryQuestion(prompt, friend.name, friend.category),
            category: prompt.category,
            depth_tier: prompt.depth_tier,
            why_it_works: prompt.cycle === 1 && friend.category === "family"
              ? "Simple and caring. Family always appreciates being checked on."
              : prompt.why_it_works,
          },
        };
      }
    }
  }

  const spotlight = ranked[0] ?? null;
  if (!spotlight) return null;
  const summary = summaries.get(spotlight.friend_id);
  const friend = friends.find((item) => item.id === spotlight.friend_id);
  if (!summary || !friend) return null;

  // Check if this friend was shown as algorithmic spotlight today already
  // to avoid re-showing immediately after skip
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: todaysSpotlights } = await params.supabase
    .from("friends")
    .select("id, last_spotlight_at")
    .eq("user_id", user.id)
    .eq("in_tribe", true)
    .gte("last_spotlight_at", today.toISOString());

  const shownTodayIds = new Set(
    (todaysSpotlights ?? []).map((f) => f.id)
  );

  // If top friend was already shown today, try the next one
  let selectedSpotlight = spotlight;
  let selectedSummary = summary;
  let selectedFriend = friend;
  
  if (shownTodayIds.has(spotlight.friend_id)) {
    // Find first friend in ranked list not shown today
    for (const score of ranked) {
      if (!shownTodayIds.has(score.friend_id)) {
        const altSummary = summaries.get(score.friend_id);
        const altFriend = friends.find((item) => item.id === score.friend_id);
        if (altSummary && altFriend) {
          selectedSpotlight = score;
          selectedSummary = altSummary;
          selectedFriend = altFriend;
          break;
        }
      }
    }
  }

  return {
    kind: "send_algorithmic",
    friend: selectedSummary,
    personalized_prompt: formatPersonalizedSpotlightPrompt(
      { barriers },
      selectedSummary.name,
      selectedSummary.days_quiet
    ),
    primary_reason: selectedSpotlight.primary_reason,
  };
}

export async function buildTodayState(params: {
  supabase: Supabase;
  user: User;
}) {
  const barriers = (params.user.barriers ?? []).filter((barrier): barrier is BarrierKey =>
    isBarrierKey(barrier)
  );
  const friends = await loadFriendContext(params.supabase, params.user.id);
  const summaries = new Map(
    friends.map((friend) => [friend.id, toSummary(friend)])
  );
  const algorithmUser: AlgorithmUser = { id: params.user.id, barriers };
  const ranked = rankFriendsForToday(
    friends.map((friend) => toAlgorithmFriend(friend)),
    algorithmUser
  );
  const tribe = ranked
    .map((score) => summaries.get(score.friend_id))
    .filter((summary): summary is FriendSummary => Boolean(summary));
  const dailyState = await getDailyState({
    supabase: params.supabase,
    user: params.user,
    friends,
    ranked,
    summaries,
    barriers,
  });
  const upNext = ranked
    .slice(1, 4)
    .map((score) => {
      const summary = summaries.get(score.friend_id);
      return summary ? toUpNext(score, summary, barriers) : null;
    })
    .filter((item): item is TodayUpNext => Boolean(item));

  return { dailyState, tribe, upNext };
}
