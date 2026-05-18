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

export type OnboardingState = {
  q1People: PersonChip[];
  q2People: PersonChip[];
  q3Barriers: BarrierId[];
  watchers: string[];
};
