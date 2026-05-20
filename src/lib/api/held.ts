import type { AvatarColor } from "@/lib/onboarding/types";

/** Friend the current user watches via Held (pilot: from onboarding watchers). */
export type HeldFriendEntry = {
  relationship_id: string;
  friend_id: string;
  name: string;
  avatar_color: AvatarColor;
  email: string | null;
  days_quiet: number;
  threshold_days: number;
  setup_notified_at: string | null;
  setup_notification_error: string | null;
  status: "active" | "paused";
  at_threshold: boolean;
};

/** KinMatch user holding the current user (pilot: usually empty). */
export type HeldByUserEntry = {
  relationship_id: string;
  name: string;
  threshold_days: number;
  status: "active" | "paused";
};

export type HeldRecentEvent = {
  id: string;
  event_type: string;
  occurred_at: string;
  friend_name: string | null;
};

export type HeldResponse = {
  holding: HeldFriendEntry[];
  held_by: HeldByUserEntry[];
  recent_events: HeldRecentEvent[];
};
