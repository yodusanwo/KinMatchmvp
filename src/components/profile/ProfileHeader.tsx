import { Pencil } from "lucide-react";
import { Headline } from "@/components/brand";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { DriftIndicator } from "@/components/today/DriftIndicator";
import type { FriendProfile } from "@/lib/api/types";

type ProfileHeaderProps = {
  friend: Pick<
    FriendProfile,
    | "name"
    | "avatar_color"
    | "avatar_color_hex"
    | "avatar_initials"
    | "vibe_label"
    | "cadence_label"
    | "days_quiet"
    | "is_drifting"
    | "last_touch_at"
  >;
  onEditAvatar?: () => void;
};

export function ProfileHeader({ friend, onEditAvatar }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <MiniAvatar
          name={friend.name}
          colorHex={friend.avatar_color_hex}
          initials={friend.avatar_initials}
          size="md"
          className="h-12 w-12 text-xs"
        />
        {onEditAvatar && (
          <button
            type="button"
            onClick={onEditAvatar}
            aria-label={`Edit ${friend.name.split(/\s+/)[0]}'s avatar`}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cream bg-terracotta text-white transition-transform active:scale-95"
          >
            <Pencil className="h-3 w-3" strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
      <Headline className="mt-2 text-2xl">{friend.name}</Headline>
      <p className="mt-1 font-sans text-xs italic text-burnt-orange">
        {friend.vibe_label}
      </p>
      <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-1.5 font-sans text-[15px] text-slate">
        <span>{friend.cadence_label} ·</span>
        {friend.is_drifting && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta"
            aria-hidden
          />
        )}
        <DriftIndicator
          daysQuiet={friend.days_quiet}
          isDrifting={friend.is_drifting}
          lastTouchAt={friend.last_touch_at}
        />
      </p>
    </div>
  );
}
