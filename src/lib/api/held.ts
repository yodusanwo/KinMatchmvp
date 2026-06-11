import type { AvatarColor } from "@/lib/onboarding/types";

export type HeldRelationshipStatus = "pending" | "accepted" | "declined";

/** Friend the current user watches via Held (pilot: from onboarding watchers). */
export type HeldFriendEntry = {
  relationship_id: string;
  friend_id: string;
  name: string;
  avatar_color: AvatarColor;
  avatar_color_hex?: string | null;
  avatar_initials?: string | null;
  email: string | null;
  days_quiet: number;
  threshold_days: number;
  invited_at: string;
  accepted_at: string | null;
  archived_at?: string | null;
  last_notified_at: string | null;
  setup_notified_at: string | null;
  setup_notification_error: string | null;
  status: HeldRelationshipStatus;
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
  eligible_friends: {
    id: string;
    name: string;
    avatar_color: AvatarColor;
    avatar_color_hex?: string | null;
    avatar_initials?: string | null;
  }[];
  quiet_threshold_days: number;
  max_watchers: number;
};
