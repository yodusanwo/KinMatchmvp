import type { BarrierId } from "@/lib/onboarding/types";
import { BARRIER_KEYS, type BarrierKey } from "./types";

/** Highest-priority barrier when multiple are selected. */
const BARRIER_PRIORITY: BarrierKey[] = [
  "forget",
  "unsure",
  "awkward",
  "busy",
  "distance",
  "one_sided",
];

const ONBOARDING_TO_BARRIER_KEY: Record<BarrierId, BarrierKey> = {
  i_forget: "forget",
  distance: "distance",
  busy: "busy",
  awkward: "awkward",
  unsure_how: "unsure",
  one_sided: "one_sided",
};

export function barrierIdToKey(id: BarrierId): BarrierKey {
  return ONBOARDING_TO_BARRIER_KEY[id];
}

export function barrierIdsToKeys(ids: BarrierId[]): BarrierKey[] {
  return [...new Set(ids.map(barrierIdToKey))];
}

export function pickPrimaryBarrier(
  barriers: BarrierKey[] | null | undefined
): BarrierKey {
  if (!barriers?.length) return "forget";
  const set = new Set(barriers);
  for (const key of BARRIER_PRIORITY) {
    if (set.has(key)) return key;
  }
  return "forget";
}

export function isBarrierKey(value: string): value is BarrierKey {
  return (BARRIER_KEYS as readonly string[]).includes(value);
}
