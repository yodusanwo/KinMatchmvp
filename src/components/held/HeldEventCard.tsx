import type { HeldRecentEvent } from "@/lib/api/held";
import { formatHeldEventType } from "@/lib/held/status";

type HeldEventCardProps = {
  event: HeldRecentEvent;
};

export function HeldEventCard({ event }: HeldEventCardProps) {
  const date = new Date(event.occurred_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="rounded-2xl border border-ink/[0.12] bg-cream-deep/50 px-4 py-3">
      <p className="font-sans text-sm text-ink">
        {formatHeldEventType(event.event_type)}
        {event.friend_name ? ` · ${event.friend_name}` : ""}
      </p>
      <p className="mt-1 font-inter text-xs italic text-ink-soft">{date}</p>
    </article>
  );
}
