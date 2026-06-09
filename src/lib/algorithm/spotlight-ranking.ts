import { firstName } from "@/lib/memories/categories";
import { pickPrimaryBarrier } from "@/lib/personalization/barriers";
import type {
  AlgorithmMemoryNote,
  Friend,
  FriendScore,
  SpotlightComponents,
  Touchpoint,
  User,
} from "./types";
import type { BarrierKey } from "@/lib/personalization/types";

const DAY_MS = 1000 * 60 * 60 * 24;

// ─────────────────────────────────────────────────────────────
// 1. CADENCE SCORE (max +40)
// "How overdue is this friendship?"
// ─────────────────────────────────────────────────────────────
export function calculateCadenceScore(
  lastContactAt: Date | string | null,
  intendedCadenceDays: number,
  today: Date
): number {
  if (!lastContactAt) return 30;

  const daysSince = daysBetween(lastContactAt, today);
  const daysOverdue = daysSince - intendedCadenceDays;

  if (daysOverdue <= 0) return 0;

  const slipRatio = daysOverdue / intendedCadenceDays;
  return Math.min(40, slipRatio * 40);
}

// ─────────────────────────────────────────────────────────────
// 2. LIFE EVENT SCORE (max +25)
// "Is there an important date coming up or recently passed?"
// ─────────────────────────────────────────────────────────────
export function calculateLifeEventScore(
  dateMemories: AlgorithmMemoryNote[],
  today: Date
): number {
  let maxScore = 0;

  for (const memory of dateMemories) {
    if (!memory.event_date) continue;

    const eventThisYear = annualizedDate(memory.event_date, today);
    const daysUntil = daysBetween(today, eventThisYear);

    let score = 0;
    if (daysUntil >= 0 && daysUntil <= 7) score = 25;
    else if (daysUntil >= 8 && daysUntil <= 14) score = 15;
    else if (daysUntil >= 15 && daysUntil <= 30) score = 8;
    else if (daysUntil >= -3 && daysUntil < 0) score = 20;

    maxScore = Math.max(maxScore, score);
  }

  return maxScore;
}

// ─────────────────────────────────────────────────────────────
// 3. RECIPROCITY SCORE (max +20)
// "They reached out, you haven't replied"
// ─────────────────────────────────────────────────────────────
export function calculateReciprocityScore(
  lastInboundAt: Date | string | null,
  lastOutboundAt: Date | string | null,
  today: Date
): number {
  if (!lastInboundAt) return 0;

  if (lastOutboundAt && new Date(lastOutboundAt) >= new Date(lastInboundAt)) {
    return 0;
  }

  const daysUnreplied = daysBetween(lastInboundAt, today);

  if (daysUnreplied <= 1) return 20;
  if (daysUnreplied <= 3) return 15;
  if (daysUnreplied <= 7) return 10;
  if (daysUnreplied <= 14) return 5;
  return 0;
}

// ─────────────────────────────────────────────────────────────
// 4. EMOTIONAL WEIGHT SCORE (max +25)
// "Is something hard happening in their life?"
// ─────────────────────────────────────────────────────────────
export function calculateEmotionalWeightScore(
  memories: AlgorithmMemoryNote[],
  today: Date
): number {
  const decayWindowDays = 90;
  let total = 0;

  for (const note of memories) {
    if (note.category !== "current" && note.category !== "trusted") continue;

    const ageDays = daysBetween(note.created_at, today);
    if (ageDays > decayWindowDays) continue;

    const decay = 1 - ageDays / decayWindowDays;
    const noteWeight = note.category === "trusted" ? 5 : 3;

    total += noteWeight * decay;
  }

  return Math.min(25, total);
}

// ─────────────────────────────────────────────────────────────
// 5. SPOTLIGHT FATIGUE (penalty, 0 to -100)
// "Don't show this person again immediately"
// ─────────────────────────────────────────────────────────────
export function calculateSpotlightFatigue(
  lastSpotlightAt: Date | string | null,
  today: Date
): number {
  if (!lastSpotlightAt) return 0;

  const days = daysBetween(lastSpotlightAt, today);

  if (days <= 1) return -100;
  if (days < 3) return -30;
  if (days < 5) return -15;
  if (days < 7) return -5;
  return 0;
}

// ─────────────────────────────────────────────────────────────
// 6. BARRIER MATCH (max +15)
// "Does this friend match the user's primary barrier context?"
// ─────────────────────────────────────────────────────────────
export function calculateBarrierMatch(
  _friend: Friend,
  primaryBarrier: BarrierKey | null,
  daysSinceContact: number,
  memoryCount: number,
  reciprocityRatio: number
): number {
  if (!primaryBarrier) return 0;

  switch (primaryBarrier) {
    case "forget":
    case "awkward":
      if (daysSinceContact > 30) return 10;
      if (daysSinceContact > 14) return 5;
      return 0;

    case "distance":
      return 5;

    case "busy":
      return 5;

    case "unsure":
      return Math.min(10, memoryCount * 2);

    case "one_sided":
      if (reciprocityRatio >= 0.4 && reciprocityRatio <= 0.6) return 10;
      return 0;

    default:
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN SCORING FUNCTION
// ─────────────────────────────────────────────────────────────
export function scoreFriendForSpotlight(
  friend: Friend,
  user: User,
  today: Date = new Date(),
  options: { ignoreFatigue?: boolean } = {}
): FriendScore {
  const intendedCadence =
    friend.intended_cadence_days ??
    friend.cadence_days ??
    (friend.is_wished_closer ? 30 : 14);
  const lastContactAt = friend.last_contact_at ?? friend.last_touch_at ?? null;
  const dateMemories =
    friend.memory_notes?.filter((note) => note.category === "dates" && note.event_date) ??
    [];
  const reciprocityRatio = calculateReciprocityRatio(friend.touchpoints ?? []);
  const primaryBarrier = user.barriers?.length
    ? pickPrimaryBarrier(user.barriers)
    : null;
  const daysSinceContact = lastContactAt ? daysBetween(lastContactAt, today) : 999;

  const components: SpotlightComponents = {
    cadence: calculateCadenceScore(lastContactAt, intendedCadence, today),
    life_event: calculateLifeEventScore(dateMemories, today),
    reciprocity: calculateReciprocityScore(
      friend.last_inbound_touch_at ?? null,
      friend.last_outbound_touch_at ?? null,
      today
    ),
    emotional_weight: calculateEmotionalWeightScore(friend.memory_notes ?? [], today),
    spotlight_fatigue: options.ignoreFatigue
      ? 0
      : calculateSpotlightFatigue(friend.last_spotlight_at ?? null, today),
    barrier_match: calculateBarrierMatch(
      friend,
      primaryBarrier,
      daysSinceContact,
      friend.memory_notes?.length ?? 0,
      reciprocityRatio
    ),
  };

  const total_score = Object.values(components).reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    friend_id: friend.id,
    friend,
    total_score,
    components,
    primary_reason: derivePrimaryReason(components, friend),
  };
}

// ─────────────────────────────────────────────────────────────
// PRIMARY REASON, human-readable explanation of top score driver
// ─────────────────────────────────────────────────────────────
export function derivePrimaryReason(
  components: SpotlightComponents,
  friend: Friend
): string {
  const positives = Object.entries(components)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a);

  if (positives.length === 0) return "rotation";

  const [topComponent] = positives[0];

  const name = firstName(friend.name);

  switch (topComponent) {
    case "reciprocity":
      return `${name} reached out, you haven't replied yet`;
    case "life_event":
      return `${name} has an important date coming up`;
    case "emotional_weight":
      return `${name} has something going on right now`;
    case "cadence":
      if (!friend.last_contact_at && !friend.last_touch_at) {
        return `you haven't reached out to ${name} yet`;
      }
      return `it's been a while with ${name}`;
    case "barrier_match":
      return `a good moment to reach out to ${name}`;
    default:
      return "rotation";
  }
}

// ─────────────────────────────────────────────────────────────
// RANK ALL FRIENDS
// ─────────────────────────────────────────────────────────────
export function rankFriendsForToday(
  friends: Friend[],
  user: User,
  today: Date = new Date()
): FriendScore[] {
  const candidates = friends.filter(
    (friend) => friend.category !== "acquaintance" && !friend.archived_at
  );
  const ignoreFatigue = candidates.length === 1;

  return candidates
    .map((friend) =>
      scoreFriendForSpotlight(friend, user, today, { ignoreFatigue })
    )
    .sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return dateMs(a.friend.created_at) - dateMs(b.friend.created_at);
    });
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
export function daysBetween(from: Date | string, to: Date | string): number {
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function annualizedDate(originalDate: string, today: Date): Date {
  const [month, day] = parseMonthDay(originalDate);
  const thisYear = new Date(today.getFullYear(), month, day);
  const daysUntilThisYear = daysBetween(today, thisYear);

  if (daysUntilThisYear >= -3) {
    return thisYear;
  }

  return new Date(today.getFullYear() + 1, month, day);
}

export function calculateReciprocityRatio(touchpoints: Touchpoint[]): number {
  if (touchpoints.length === 0) return 0.5;
  const outbound = touchpoints.filter(
    (touchpoint) => (touchpoint.direction ?? "outbound") === "outbound"
  ).length;
  return outbound / touchpoints.length;
}

function startOfDay(value: Date | string): Date {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseMonthDay(originalDate: string): [number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(originalDate);
  if (!match) {
    const fallback = new Date(originalDate);
    return [fallback.getMonth(), fallback.getDate()];
  }
  return [Number(match[2]) - 1, Number(match[3])];
}

function dateMs(value: Date | string | undefined): number {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}
