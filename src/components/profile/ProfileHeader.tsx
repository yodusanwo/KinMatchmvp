import { Headline } from "@/components/brand";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { DriftIndicator } from "@/components/today/DriftIndicator";
import type { FriendProfile } from "@/lib/api/types";

type ProfileHeaderProps = {
  friend: Pick<
    FriendProfile,
    | "name"
    | "avatar_color"
    | "vibe_label"
    | "cadence_label"
    | "days_quiet"
    | "is_drifting"
  >;
};

export function ProfileHeader({ friend }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <MiniAvatar
        name={friend.name}
        avatarColor={friend.avatar_color}
        size="md"
        className="h-16 w-16 text-sm"
      />
      <Headline className="mt-4">{friend.name}</Headline>
      <p className="mt-1 font-inter text-sm italic text-terracotta">
        {friend.vibe_label}
      </p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-1 font-sans text-xs text-ink-soft">
        <span>{friend.cadence_label} ·</span>
        <DriftIndicator
          daysQuiet={friend.days_quiet}
          isDrifting={friend.is_drifting}
        />
      </p>
    </div>
  );
}
