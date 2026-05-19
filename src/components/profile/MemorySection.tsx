import type { MemoryCategory, MemoryNote } from "@/lib/api/types";
import {
  MEMORY_CATEGORIES,
  MEMORY_CATEGORY_ORDER,
  firstName,
} from "@/lib/memories/categories";
import { cn } from "@/lib/cn";
import { Plus } from "lucide-react";

type MemorySectionProps = {
  friendName: string;
  memories: MemoryNote[];
  onAddCategory: (category: MemoryCategory) => void;
  highlightId?: string | null;
};

export function MemorySection({
  friendName,
  memories,
  onAddCategory,
  highlightId,
}: MemorySectionProps) {
  const name = firstName(friendName);

  const byCategory = MEMORY_CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = memories.filter((note) => note.category === category);
      return acc;
    },
    {} as Record<MemoryCategory, MemoryNote[]>
  );

  return (
    <section className="space-y-4">
      {MEMORY_CATEGORY_ORDER.map((categoryId) => {
        const config = MEMORY_CATEGORIES[categoryId];
        const Icon = config.icon;
        const notes = byCategory[categoryId];
        const empty = config.emptyPrompt(name);

        return (
          <div key={categoryId}>
            <div className="flex items-center">
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: "rgba(31, 26, 20, 0.55)" }}
                strokeWidth={1.75}
                aria-hidden
              />
              <h3
                className="ml-1.5 font-inter text-[13px] font-medium leading-none"
                style={{ color: "rgba(31, 26, 20, 0.85)" }}
              >
                {config.title(name)}
              </h3>
              <button
                type="button"
                onClick={() => onAddCategory(categoryId)}
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-cream-deep"
                aria-label={`Add ${config.chipLabel.toLowerCase()} note about ${friendName}`}
              >
                <Plus
                  className="h-3.5 w-3.5"
                  style={{ color: "rgba(31, 26, 20, 0.45)" }}
                  strokeWidth={2}
                />
              </button>
            </div>

            {notes.length > 0 ? (
              <ul className="mt-1 flex flex-col gap-1 pl-[22px]">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className={cn(
                      "font-inter text-xs italic leading-[1.5] transition-opacity duration-500",
                      highlightId === note.id
                        ? "text-ink"
                        : "text-[rgba(31,26,20,0.75)]"
                    )}
                  >
                    · {note.text}
                    {note.event_date && categoryId === "dates" ? (
                      <span className="not-italic text-[rgba(31,26,20,0.45)]">
                        {" "}
                        ({formatEventDate(note.event_date)})
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={() => onAddCategory(categoryId)}
                className="mt-1 pl-[22px] text-left font-inter text-xs italic leading-[1.5]"
                style={{ color: "rgba(31, 26, 20, 0.4)" }}
              >
                {empty.before}
                <span className="text-terracotta underline decoration-terracotta underline-offset-2">
                  {empty.link}
                </span>
                {empty.after}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

function formatEventDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
