import { AVATAR_COLORS, type AvatarColor } from "@/lib/onboarding/types";

/** Stable avatar color for a user when no profile color is stored. */
export function avatarColorFromUserId(userId: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i) * (i + 1)) % 1000;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
