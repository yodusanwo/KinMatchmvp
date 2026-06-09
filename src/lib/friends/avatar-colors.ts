import type { FriendCategory } from "@/lib/api/types";

// Consistent color palettes for each category
const CATEGORY_COLOR_PALETTES: Record<FriendCategory, string[]> = {
  inner_circle: [
    "#E89470", "#C68F3E", "#D4A67C", "#B8977A", "#E8A88C",
    "#D4926A", "#B07D4E", "#E0A882", "#C89058", "#D89876"
  ],
  village: [
    "#9DB58A", "#D4A356", "#8BA878", "#C69546", "#AAC79A",
    "#91AB7C", "#C8A04C", "#A5C28E", "#BA9842", "#98B384"
  ],
  family: [
    "#D4A67C", "#B8977A", "#C89668", "#A88665", "#E0B68A",
    "#CC9E70", "#B48E72", "#D8AE84", "#C0926C", "#DCB08C"
  ],
  acquaintance: [
    "#9DB58A", "#D4A356", "#B8977A", "#C89058",
    "#A5C28E", "#C8A04C", "#B0927C", "#BC9848",
    "#91AB7C", "#C69546"
  ],
};

/**
 * Generate a consistent color for a friend based on their ID and category.
 * Uses a hash of the ID to deterministically select from the category palette.
 */
export function getFriendColor(friendId: string, category: FriendCategory): string {
  const palette = CATEGORY_COLOR_PALETTES[category];
  const hash = [...friendId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}
