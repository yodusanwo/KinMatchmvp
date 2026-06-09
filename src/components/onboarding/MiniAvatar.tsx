import { avatarColorClasses, getInitials } from "@/lib/onboarding/avatar-colors";
import type { AvatarColor } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";

type MiniAvatarProps = {
  name: string;
  avatarColor: AvatarColor;
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
  avatarColor,
  size = "sm",
  className,
}: MiniAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-sans font-medium",
        sizeClasses[size],
        avatarColorClasses[avatarColor],
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
