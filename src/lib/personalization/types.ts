export const BARRIER_KEYS = [
  "forget",
  "distance",
  "busy",
  "awkward",
  "unsure",
  "one_sided",
] as const;

export type BarrierKey = (typeof BARRIER_KEYS)[number];

export type CopyField =
  | "welcomeBody"
  | "spotlightPromptStyle"
  | "dailyCheckinSubject";

export type PersonalizableUser = {
  barriers?: BarrierKey[] | null;
};

export type PersonalizationVars = {
  name: string;
  days: number;
  memory?: string | null;
};
