import type { AvatarColor } from "@/lib/onboarding/types";

export type FriendSummary = {
  id: string;
  name: string;
  avatar_color: AvatarColor;
  vibe: string;
  cadence_days: number;
  days_quiet: number;
  is_drifting: boolean;
  last_touch_at: string | null;
};

export type TodaySpotlight = {
  friend_id: string;
  name: string;
  avatar_color: AvatarColor;
  days_quiet: number;
  prompt_text: string;
  suggested_action: string;
} | null;

export type TodayResponse = {
  spotlight: TodaySpotlight;
  tribe: FriendSummary[];
};

export type MemoryCategory =
  | "people"
  | "dates"
  | "current"
  | "loves"
  | "shared"
  | "trusted"
  | "other";

export type MemoryNote = {
  id: string;
  friend_id: string;
  text: string;
  category: MemoryCategory;
  event_date?: string;
  source:
    | "manual"
    | "voice_extraction"
    | "paste_extraction"
    | "add_connection";
  created_at: string;
  last_surfaced_at?: string;
};

export type SharedInterest = {
  id: string;
  label: string;
};

export type Ritual = {
  id: string;
  label: string;
  cadence: string;
  streak_count: number;
  last_occurred_at: string | null;
};

export type Interaction = {
  id: string;
  type: string;
  occurred_at: string;
  notes: string | null;
};

export type FriendProfile = FriendSummary & {
  where_met: string | null;
  is_wished_closer: boolean;
  memories: MemoryNote[];
  shared_interests: SharedInterest[];
  rituals: Ritual[];
  interactions: Interaction[];
  cadence_label: string;
  vibe_label: string;
};
