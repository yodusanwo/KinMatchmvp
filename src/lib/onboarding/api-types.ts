import type { BarrierId, CircleId, PersonChip } from "./types";

export type CompleteOnboardingPayload = {
  q1People: PersonChip[];
  q2People: PersonChip[];
  circleAssignments?: Record<string, CircleId>;
  q3Barriers: BarrierId[];
  watchers: string[];
};
