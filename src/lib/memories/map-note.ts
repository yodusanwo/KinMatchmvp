import type { MemoryNote } from "@/lib/api/types";
import type { MemoryCategory } from "@/lib/memories/types";
import { isMemoryCategory } from "@/lib/memories/types";

type MemoryNoteRow = {
  id: string;
  friend_id?: string;
  text: string;
  tag: string;
  event_date?: string | null;
  source?: string;
  created_at: string;
  last_surfaced_at?: string | null;
};

export function mapMemoryNoteRow(row: MemoryNoteRow): MemoryNote {
  const category: MemoryCategory = isMemoryCategory(row.tag)
    ? row.tag
    : "other";

  return {
    id: row.id,
    friend_id: row.friend_id ?? "",
    text: row.text,
    category,
    event_date: row.event_date ?? undefined,
    source:
      row.source === "manual" ||
      row.source === "voice_extraction" ||
      row.source === "paste_extraction" ||
      row.source === "add_connection"
        ? row.source
        : "manual",
    created_at: row.created_at,
    last_surfaced_at: row.last_surfaced_at ?? undefined,
  };
}
