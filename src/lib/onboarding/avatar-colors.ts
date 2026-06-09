import type { AvatarColor } from "./types";
import { AVATAR_COLORS } from "./types";

export const avatarColorClasses: Record<AvatarColor, string> = {
  t: "bg-[#D4A67C] text-ink",
  t2: "bg-[#D4A356] text-ink",
  f: "bg-[#9DB58A] text-ink",
  m: "bg-[#E89470] text-ink",
  g: "bg-[#B8977A] text-ink",
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
