export const DATE_EVENT_KINDS = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "memorial", label: "Memorial" },
  { value: "milestone", label: "Milestone" },
  { value: "other", label: "Other" },
] as const;

export type DateEventKind = (typeof DATE_EVENT_KINDS)[number]["value"];

export type DateEventKindWithContext = "memorial" | "milestone" | "other";

export function isDateEventWithContext(
  kind: DateEventKind
): kind is DateEventKindWithContext {
  return kind === "memorial" || kind === "milestone" || kind === "other";
}

export function dateEventNeedsContext(kind: DateEventKind): boolean {
  return isDateEventWithContext(kind);
}

export function getDateEventContextConfig(kind: DateEventKind) {
  if (!isDateEventWithContext(kind)) return null;
  return DATE_EVENT_CONTEXT_FIELDS[kind];
}

export const DATE_EVENT_CONTEXT_FIELDS: Record<
  "memorial" | "milestone" | "other",
  { label: string; placeholder: (firstName: string) => string }
> = {
  memorial: {
    label: "Who or what is this memorial for?",
    placeholder: () => "e.g. her mother, Pat",
  },
  milestone: {
    label: "What is this milestone?",
    placeholder: (name) => `e.g. ${name}'s college graduation, finishing chemo`,
  },
  other: {
    label: "What is this date about?",
    placeholder: () => "e.g. work anniversary, pet adoption day",
  },
};

export function buildDateNoteText(
  firstName: string,
  kind: DateEventKind,
  context?: string
): string {
  const ctx = context?.trim() ?? "";

  switch (kind) {
    case "birthday":
      return `${firstName}'s birthday`;
    case "anniversary":
      return `${firstName}'s anniversary`;
    case "memorial":
      return ctx ? `Memorial for ${ctx}` : "";
    case "milestone":
      return ctx ? `${firstName}'s ${ctx}` : "";
    case "other":
      return ctx;
  }
}
