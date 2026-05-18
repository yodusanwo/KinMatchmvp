import { Heart } from "lucide-react";
import type { HeldByUserEntry } from "@/lib/api/held";

type HeldByRowProps = {
  entry: HeldByUserEntry;
};

export function HeldByRow({ entry }: HeldByRowProps) {
  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-deep">
        <Heart
          className="h-4 w-4 fill-terracotta text-terracotta"
          aria-hidden
        />
      </span>
      <div>
        <p className="font-sans text-sm font-medium text-ink">{entry.name}</p>
        <p className="font-inter text-xs italic text-ink-soft">
          Holding you · alerts at {entry.threshold_days}d quiet
        </p>
      </div>
    </li>
  );
}
