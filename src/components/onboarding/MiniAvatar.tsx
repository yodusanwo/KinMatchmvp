import {
  getAvatarTextColor,
  getFriendColor,
  getInitials,
} from "@/lib/friends/avatar-colors";
import type { AvatarColor } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";
import Image from "next/image";

type MiniAvatarProps = {
  name: string;
  /**
   * Optional explicit seed for the color (defaults to `name`). Pass a stable
   * value like the friend's id if you have it; otherwise the name is used so
   * the same person gets the same color on every page.
   */
  colorSeed?: string;
  /** @deprecated kept for backwards compatibility; color now derives from name/colorSeed. */
  avatarColor?: AvatarColor;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-7 w-7 text-[12px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function MiniAvatar({
  name,
  colorSeed,
  avatarUrl,
  size = "sm",
  className,
}: MiniAvatarProps) {
  if (avatarUrl) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          sizeClasses[size],
          className
        )}
        aria-hidden
      >
        <Image
          src={avatarUrl}
          alt={name}
          width={48}
          height={48}
          className="h-full w-full object-cover"
          unoptimized
        />
      </span>
    );
  }

  const bgColor = getFriendColor(colorSeed ?? name);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-sans font-medium",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bgColor, color: getAvatarTextColor(bgColor) }}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
