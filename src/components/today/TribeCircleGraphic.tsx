import Link from "next/link";
import type { FriendSummary } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDisplayName } from "@/lib/names/format";
import {
  getAvatarTextColor,
  resolveFriendColor,
  resolveInitials,
} from "@/lib/friends/avatar-colors";

type TribeCircleGraphicProps = {
  tribe: FriendSummary[];
  highlightFriendId?: string;
  className?: string;
};

const CIRCLE_SLOTS: { top: string; left: string }[] = [
  { top: "18%", left: "50%" },
  { top: "40%", left: "20%" },
  { top: "40%", left: "80%" },
  { top: "74%", left: "32%" },
  { top: "74%", left: "68%" },
  { top: "57%", left: "50%" },
];

function quietLabel(friend: FriendSummary) {
  if (!friend.last_touch_at) return "not yet";
  return friend.days_quiet === 0 ? "today" : `${friend.days_quiet}d quiet`;
}

export function TribeCircleGraphic({
  tribe,
  highlightFriendId,
  className,
}: TribeCircleGraphicProps) {
  if (tribe.length === 0) {
    return (
      <p className="font-inter text-sm italic text-ink-soft">
        Add your first connection to begin.
      </p>
    );
  }

  const displayTribe = tribe.slice(0, CIRCLE_SLOTS.length);
  const overflow = tribe.length - displayTribe.length;

  return (
    <div
      className={cn(
        "relative mx-auto h-[200px] w-full max-w-[320px] rounded-[2rem] border border-ink/[0.1] bg-cream-deep/35",
        className
      )}
    >
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-terracotta/25" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ink/[0.1]" />

      {displayTribe.map((friend, index) => {
        const slot = CIRCLE_SLOTS[index];
        return (
          <Link
            key={friend.id}
            href={`/friends/${friend.id}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center transition-transform hover:scale-105 active:scale-95"
            style={{ top: slot.top, left: slot.left }}
            aria-label={`Open ${friend.name}'s profile`}
          >
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-sans text-sm font-medium ring-2 ring-cream",
                friend.is_drifting && "ring-terracotta/60",
                friend.id === highlightFriendId &&
                  "shadow-[0_0_0_2px_rgba(182,82,50,0.3)]"
              )}
              style={{
                backgroundColor: resolveFriendColor(
                  friend.name,
                  friend.avatar_color_hex
                ),
                color: getAvatarTextColor(
                  resolveFriendColor(friend.name, friend.avatar_color_hex)
                ),
              }}
              aria-hidden
            >
              {resolveInitials(friend.name, friend.avatar_initials)}
            </span>
            <span className="max-w-[64px] truncate font-sans text-[15px] font-medium leading-none text-ink">
              {formatDisplayName(friend.name)}
            </span>
            <span className="font-sans text-[9px] leading-none text-ink-soft">
              {quietLabel(friend)}
            </span>
          </Link>
        );
      })}

      {overflow > 0 && (
        <Link
          href="/tribe"
          className="absolute bottom-2 right-3 rounded-full bg-cream px-2 py-1 font-sans text-[12px] text-ink-soft"
        >
          +{overflow} more
        </Link>
      )}
    </div>
  );
}
