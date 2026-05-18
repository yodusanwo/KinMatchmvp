import type { AvatarColor } from "@/lib/onboarding/types";

export type FriendRow = {
  id: string;
  name: string;
  avatar_color: AvatarColor;
  vibe: string;
  cadence_days: number;
  last_touch_at: string | null;
  created_at: string;
  is_wished_closer?: boolean;
};

export function daysQuiet(friend: Pick<FriendRow, "last_touch_at" | "created_at">): number {
  const anchor = friend.last_touch_at ?? friend.created_at;
  const diff = Date.now() - new Date(anchor).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function isDrifting(friend: Pick<FriendRow, "cadence_days" | "last_touch_at" | "created_at">): boolean {
  return daysQuiet(friend) >= friend.cadence_days;
}

export function cadenceLabel(cadenceDays: number): string {
  if (cadenceDays <= 7) return "Weekly";
  if (cadenceDays <= 14) return "Biweekly";
  if (cadenceDays <= 31) return "Monthly";
  return `Every ${cadenceDays} days`;
}

export function vibeLabel(vibe: string): string {
  const labels: Record<string, string> = {
    potential_close: "A friendship you're growing",
    activity: "An activity friendship",
    professional: "A professional connection",
    community: "A community connection",
  };
  return labels[vibe] ?? "A connection you care about";
}

export function defaultSpotlightPrompt(name: string, days: number): string {
  if (days >= 14) {
    return `${name} has been quiet for a while. A voice note might land softer than a text.`;
  }
  if (days >= 7) {
    return `It's been ${days} days since you reached out. Something small from you could mean a lot.`;
  }
  return `${name} is on your mind today. A quick voice note keeps the rhythm going.`;
}
