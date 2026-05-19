export const MEMORY_CATEGORIES = [
  "people",
  "dates",
  "current",
  "loves",
  "shared",
  "trusted",
  "other",
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type ExtractedMemoryCandidate = {
  text: string;
  category: MemoryCategory;
  event_date?: string;
};

export function isMemoryCategory(value: string): value is MemoryCategory {
  return (MEMORY_CATEGORIES as readonly string[]).includes(value);
}
