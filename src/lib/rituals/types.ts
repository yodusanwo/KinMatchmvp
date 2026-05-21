export const RITUAL_FREQUENCIES = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const;

export type RitualFrequency = (typeof RITUAL_FREQUENCIES)[number];

export type RitualSummary = {
  id: string;
  name: string;
  description: string | null;
  frequency: RitualFrequency;
  recurrence_pattern: string | null;
  next_date: string | null;
  status: "active" | "paused" | "archived";
  participants: { id: string; name: string }[];
  occurrences: {
    id: string;
    scheduled_date: string;
    status: "upcoming" | "completed" | "missed";
    completed_at: string | null;
    notes: string | null;
  }[];
};

export function isRitualFrequency(value: unknown): value is RitualFrequency {
  return (
    typeof value === "string" &&
    (RITUAL_FREQUENCIES as readonly string[]).includes(value)
  );
}

export function frequencyLabel(
  frequency: RitualFrequency,
  recurrencePattern?: string | null
) {
  if (frequency === "custom" && recurrencePattern) return recurrencePattern;
  const labels: Record<RitualFrequency, string> = {
    weekly: "Weekly",
    biweekly: "Every other week",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    custom: "Something else",
  };
  return labels[frequency];
}

export function nextDateAfter(
  date: string,
  frequency: RitualFrequency
): string | null {
  if (frequency === "custom") return null;
  const next = new Date(`${date}T12:00:00`);
  if (Number.isNaN(next.getTime())) return null;

  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "biweekly") next.setDate(next.getDate() + 14);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  if (frequency === "quarterly") next.setMonth(next.getMonth() + 3);
  if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);

  return next.toISOString().slice(0, 10);
}
