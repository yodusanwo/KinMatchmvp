import { Eyebrow } from "@/components/brand";
import type { Interaction } from "@/lib/api/types";
import { interactionLabel } from "@/lib/profile/format";

type RecentInteractionsListProps = {
  interactions: Interaction[];
};

export function RecentInteractionsList({
  interactions,
}: RecentInteractionsListProps) {
  return (
    <section>
      <Eyebrow className="mb-3">recent</Eyebrow>
      {interactions.length === 0 ? (
        <p className="font-inter text-sm italic text-ink-soft">
          No recent touchpoints logged.
        </p>
      ) : (
        <ul className="space-y-2">
          {interactions.map((item) => (
            <li key={item.id} className="font-sans text-sm text-ink-soft">
              <span className="text-ink">{interactionLabel(item.type)}</span>
              {" · "}
              {new Date(item.occurred_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
