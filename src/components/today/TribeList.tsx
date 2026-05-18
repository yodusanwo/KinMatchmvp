import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { DriftIndicator } from "./DriftIndicator";
import type { FriendSummary } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type TribeListProps = {
  tribe: FriendSummary[];
  className?: string;
};

export function TribeList({ tribe, className }: TribeListProps) {
  if (tribe.length === 0) {
    return (
      <p className="font-inter text-sm italic text-ink-soft">
        Add your first connection to begin. If you already signed in, try{" "}
        <Link href="/onboarding/finish" className="text-terracotta underline">
          completing setup
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className={cn("divide-y divide-ink/[0.12]", className)}>
      {tribe.map((friend) => (
        <li key={friend.id}>
          <Link
            href={`/friends/${friend.id}`}
            className="group flex items-center justify-between gap-3 rounded-lg py-3.5 transition-colors hover:bg-cream-deep/60 active:bg-cream-deep"
          >
            <div className="flex min-w-0 items-center gap-3">
              <MiniAvatar
                name={friend.name}
                avatarColor={friend.avatar_color}
                size="sm"
              />
              <span className="truncate font-sans text-sm font-medium text-ink group-hover:text-terracotta">
                {friend.name}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DriftIndicator
                daysQuiet={friend.days_quiet}
                isDrifting={friend.is_drifting}
              />
              <ChevronRight
                className="h-4 w-4 text-ink-soft group-hover:text-terracotta"
                aria-hidden
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
