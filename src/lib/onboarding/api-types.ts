import type { BarrierId, PersonChip } from "./types";

export type CompleteOnboardingPayload = {
  q1People: PersonChip[];
  q2People: PersonChip[];
  q3Barriers: BarrierId[];
  watchers: string[];
};
