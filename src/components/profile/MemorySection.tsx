import { Eyebrow } from "@/components/brand";
import type { MemoryNote } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type MemorySectionProps = {
  friendName: string;
  memories: MemoryNote[];
  onAdd: () => void;
  highlightId?: string | null;
};

export function MemorySection({
  friendName,
  memories,
  onAdd,
  highlightId,
}: MemorySectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>things to remember</Eyebrow>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-8 items-center justify-center rounded-full font-sans text-xl leading-none text-terracotta transition-colors hover:bg-cream-deep"
          aria-label={`Add a note about ${friendName}`}
        >
          +
        </button>
      </div>
      {memories.length === 0 ? (
        <p className="font-inter text-sm italic text-ink-soft">
          Add a note about {friendName} — anything small or specific.
        </p>
      ) : (
        <ul className="space-y-3">
          {memories.map((note) => (
            <li
              key={note.id}
              className={cn(
                "font-inter text-sm italic leading-relaxed text-ink-soft transition-opacity duration-500",
                highlightId === note.id && "text-ink"
              )}
            >
              · {note.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
