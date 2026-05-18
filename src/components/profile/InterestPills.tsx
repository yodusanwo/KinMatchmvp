import { Eyebrow } from "@/components/brand";
import type { SharedInterest } from "@/lib/api/types";

type InterestPillsProps = {
  interests: SharedInterest[];
};

export function InterestPills({ interests }: InterestPillsProps) {
  return (
    <section>
      <Eyebrow className="mb-3">shared interests</Eyebrow>
      {interests.length === 0 ? (
        <p className="font-inter text-sm italic text-ink-soft">None yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <span
              key={interest.id}
              className="rounded-full border border-ink/[0.2] bg-cream-deep/40 px-3 py-1 font-sans text-xs text-ink"
            >
              {interest.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
