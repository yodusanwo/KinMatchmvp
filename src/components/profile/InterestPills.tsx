import { Eyebrow } from "@/components/brand";
import type { SharedInterest } from "@/lib/api/types";
import { Plus } from "lucide-react";

type InterestPillsProps = {
  friendName: string;
  interests: SharedInterest[];
  onAdd: () => void;
};

export function InterestPills({
  friendName,
  interests,
  onAdd,
}: InterestPillsProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>shared interests</Eyebrow>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-cream-deep"
          aria-label={`Add a shared interest with ${friendName}`}
        >
          <Plus
            className="h-3.5 w-3.5"
            style={{ color: "rgba(31, 26, 20, 0.45)" }}
            strokeWidth={2}
          />
        </button>
      </div>
      {interests.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="font-inter text-sm italic text-ink-soft"
        >
          Add something you both connect over →
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <span
              key={interest.id}
              className="rounded-sm border border-hairline bg-cream-deep px-3 py-1 font-sans text-xs text-ink"
            >
              {interest.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
