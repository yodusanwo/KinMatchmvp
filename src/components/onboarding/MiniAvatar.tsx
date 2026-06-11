import {
  getAvatarTextColor,
  resolveFriendColor,
  getInitials,
} from "@/lib/friends/avatar-colors";
import type { AvatarColor } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";
import Image from "next/image";

type MiniAvatarProps = {
  name: string;
  /**
   * Optional explicit seed for the auto color (defaults to `name`). Used only
   * when no `colorHex` override is provided.
   */
  colorSeed?: string;
  /** An explicit color the user chose for this friend; wins over the auto color. */
  colorHex?: string | null;
  /** @deprecated kept for backwards compatibility; color now derives from name/colorHex. */
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
  colorHex,
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

  const bgColor = resolveFriendColor(colorSeed ?? name, colorHex);

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
