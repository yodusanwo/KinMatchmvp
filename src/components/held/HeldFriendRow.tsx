import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import type { HeldFriendEntry } from "@/lib/api/held";
import { heldQuietStatus } from "@/lib/held/status";

type HeldFriendRowProps = {
  entry: HeldFriendEntry;
};

export function HeldFriendRow({ entry }: HeldFriendRowProps) {
  return (
    <li>
      <Link
        href={`/friends/${entry.friend_id}`}
        className="flex items-center justify-between gap-3 rounded-lg py-3.5 transition-colors hover:bg-cream-deep/60"
      >
        <div className="flex min-w-0 items-center gap-3">
          <MiniAvatar
            name={entry.name}
            avatarColor={entry.avatar_color}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-medium text-ink">
              {entry.name}
            </p>
            <p
              className={
                entry.at_threshold
                  ? "font-inter text-xs italic text-terracotta-deep"
                  : "font-inter text-xs italic text-ink-soft"
              }
            >
              {heldQuietStatus(
                entry.days_quiet,
                entry.threshold_days,
                entry.at_threshold
              )}
            </p>
          </div>
          </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft/50" aria-hidden />
      </Link>
    </li>
  );
}
