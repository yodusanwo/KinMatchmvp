import type { AvatarColor } from "./types";
import { AVATAR_COLORS } from "./types";

export const avatarColorClasses: Record<AvatarColor, string> = {
  t: "bg-terracotta text-cream",
  t2: "bg-terracotta-deep text-cream",
  f: "bg-forest text-cream",
  m: "bg-mustard text-ink",
  g: "bg-sage text-cream",
};

export function randomAvatarColor(): AvatarColor {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}
