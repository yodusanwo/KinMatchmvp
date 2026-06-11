import type { AvatarColor } from "@/lib/onboarding/types";
import type { SpotlightComponents } from "@/lib/algorithm/types";

export type FriendSummary = {
  id: string;
  name: string;
  avatar_color: AvatarColor;
  avatar_color_hex?: string | null;
  avatar_initials?: string | null;
  vibe: string;
  category: FriendCategory;
  cadence_days: number;
  days_quiet: number;
  is_drifting: boolean;
  last_touch_at: string | null;
  phone_number?: string | null;
  archived_at: string | null;
};

export type FriendCategory = "inner_circle" | "village" | "family" | "acquaintance";

export type TodaySpotlight = {
  friend_id: string;
  name: string;
  avatar_color: AvatarColor;
  avatar_color_hex?: string | null;
  avatar_initials?: string | null;
  days_quiet: number;
  prompt_text: string;
  suggested_action: string;
  total_score?: number;
  component_scores?: SpotlightComponents;
  primary_reason?: string;
} | null;

export type TodayUpNext = NonNullable<TodaySpotlight>;

export type TodayResponse = {
  spotlight: TodaySpotlight;
  dailyState?: TodayDailyState | null;
  upNext?: TodayUpNext[];
  pendingCaptures?: PendingCapturePrompt[];
  discoveryPrompt?: TodayDiscoveryPrompt | null;
  tribe: FriendSummary[];
};

export type PendingCapturePrompt = {
  interaction_id: string;
  friend_id: string;
  friend_name: string;
  mode: "voice_note_sent";
  occurred_at: string;
  prompt: string;
};

export type TodayDiscoveryPrompt = {
  day: number;
  friend_id: string;
  friend_name: string;
  question: string;
  primary_cta_label: string;
  primary_cta_url: string;
  why_it_works: string;
};

export type TodayDailyState =
  | {
      kind: "capture";
      friend: FriendSummary;
      voice_note: {
        id: string;
        created_at: string;
        duration_seconds: number;
      };
      original_question: string;
      day_number?: number;
      cycle_number?: number;
    }
  | {
      kind: "send_discovery";
      friend: FriendSummary;
      day_number: number;
      cycle_number: number;
      prompt: {
        cycle: number;
        question: string;
        category: MemoryCategory;
        depth_tier: 1 | 2 | 3;
        why_it_works: string;
      };
    }
  | {
      kind: "send_algorithmic";
      friend: FriendSummary;
      personalized_prompt: string;
      primary_reason: string;
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
  phone_number: string | null;
  is_wished_closer: boolean;
  memories: MemoryNote[];
  shared_interests: SharedInterest[];
  rituals: Ritual[];
  interactions: Interaction[];
  cadence_label: string;
  vibe_label: string;
  profile_prompt: FriendProfilePrompt;
};

export type FriendProfilePrompt =
  | {
      kind: "send";
      quote: string;
      why_this_works?: string | null;
      cta_label: string;
      cta_href: string;
    }
  | {
      kind: "capture";
      quote: string;
      prompt: string;
      cta_label: string;
      cta_href: string;
    };

export type DashboardResponse = {
  user: {
    firstName: string;
  };
  coreTribe: FriendSummary[];
  momentum: {
    growing: FriendSummary[];
    stable: FriendSummary[];
    needsAttention: FriendSummary[];
  };
  insights: {
    weeklyReachOuts: number;
    weeklyVoiceNotes: number;
  };
};
