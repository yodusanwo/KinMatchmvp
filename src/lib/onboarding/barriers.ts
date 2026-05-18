import type { BarrierId } from "./types";

export type BarrierOption = {
  id: BarrierId;
  label: string;
};

export const BARRIER_OPTIONS: BarrierOption[] = [
  { id: "i_forget", label: "I forget to follow up" },
  { id: "distance", label: "Distance or location" },
  { id: "busy", label: "Too busy / scheduling" },
  { id: "awkward", label: "Awkward / haven't talked in a while" },
  { id: "unsure_how", label: "Not sure how to deepen it" },
  { id: "one_sided", label: "It feels one-sided" },
];
