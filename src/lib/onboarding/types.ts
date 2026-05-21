export const AVATAR_COLORS = ["t", "t2", "f", "m", "g"] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export type PersonChip = {
  id: string;
  name: string;
  avatarColor: AvatarColor;
};

export type BarrierId =
  | "i_forget"
  | "distance"
  | "busy"
  | "awkward"
  | "unsure_how"
  | "one_sided";

export type CircleId = "inner" | "village" | "acquaintance";

export type OnboardingState = {
  userName: string;
  q1People: PersonChip[];
  q2People: PersonChip[];
  circleAssignments: Record<string, CircleId>;
  q3Barriers: BarrierId[];
  watchers: string[];
};
