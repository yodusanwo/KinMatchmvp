import type { AvatarColor } from "@/lib/onboarding/types";
import type { BarrierKey } from "@/lib/personalization/types";
import type { MemoryCategory } from "@/lib/memories/types";

export type SpotlightComponents = {
  cadence: number;
  life_event: number;
  reciprocity: number;
  emotional_weight: number;
  spotlight_fatigue: number;
  barrier_match: number;
};

export type Touchpoint = {
  id?: string;
  direction?: "outbound" | "inbound" | null;
  occurred_at?: string | Date;
};

export type AlgorithmMemoryNote = {
  id?: string;
  friend_id?: string;
  text?: string;
  category: MemoryCategory;
  event_date?: string | null;
  created_at: string | Date;
};

export type Friend = {
  id: string;
  name: string;
  avatar_color?: AvatarColor;
  vibe?: string;
  category?: "inner_circle" | "village" | "acquaintance" | null;
  archived_at?: string | Date | null;
  created_at?: string | Date;
  last_contact_at?: string | Date | null;
  last_touch_at?: string | Date | null;
  intended_cadence_days?: number | null;
  cadence_days?: number | null;
  is_wished_closer?: boolean | null;
  last_spotlight_at?: string | Date | null;
  last_inbound_touch_at?: string | Date | null;
  last_outbound_touch_at?: string | Date | null;
  memory_notes?: AlgorithmMemoryNote[];
  touchpoints?: Touchpoint[];
};

export type User = {
  id: string;
  barriers?: BarrierKey[] | null;
};

export type FriendScore = {
  friend_id: string;
  friend: Friend;
  total_score: number;
  components: SpotlightComponents;
  primary_reason: string;
};
