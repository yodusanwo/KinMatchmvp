export const MEMORY_TAGS = [
  "health",
  "family",
  "work",
  "milestone",
  "interest",
  "other",
] as const;

export type MemoryTag = (typeof MEMORY_TAGS)[number];

export type ExtractedMemoryCandidate = {
  text: string;
  tag: MemoryTag;
  event_date?: string;
};

export function isMemoryTag(value: string): value is MemoryTag {
  return (MEMORY_TAGS as readonly string[]).includes(value);
}
