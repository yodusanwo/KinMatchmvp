import { Eyebrow } from "@/components/brand";
import type { Ritual } from "@/lib/api/types";
import { ritualCadenceLabel } from "@/lib/profile/format";

type RitualListProps = {
  rituals: Ritual[];
};

export function RitualList({ rituals }: RitualListProps) {
  return (
    <section>
      <Eyebrow className="mb-3">rituals</Eyebrow>
      {rituals.length === 0 ? (
        <p className="font-inter text-sm italic text-ink-soft">None yet.</p>
      ) : (
        <ul className="space-y-2">
          {rituals.map((ritual) => (
            <li key={ritual.id} className="font-sans text-sm text-ink-soft">
              <span className="text-ink">{ritual.label}</span>
              {" · "}
              {ritualCadenceLabel(ritual.cadence)} · {ritual.streak_count} in a
              row
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
