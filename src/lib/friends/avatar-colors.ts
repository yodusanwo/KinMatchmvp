import type { FriendCategory } from "@/lib/api/types";

// All categories use the same maximally distinct 15-color palette
// ONE color per color family - no similar shades that could be confused
const SHARED_COLOR_PALETTE = [
  "#D65745",  // 1. Vibrant red
  "#FF9B82",  // 2. Bright coral
  "#FF8C42",  // 3. Bright orange
  "#F4C542",  // 4. Golden yellow
  "#A8B560",  // 5. Lime green
  "#4A8B57",  // 6. Emerald green
  "#2F4F32",  // 7. Deep forest
  "#5B9AA0",  // 8. Teal
  "#6B7FA8",  // 9. Slate blue
  "#8B6BA8",  // 10. Purple
  "#A85B7F",  // 11. Mauve
  "#8E3D22",  // 12. Deep burgundy
  "#A0522D",  // 13. Sienna brown
  "#B8860B",  // 14. Dark gold
  "#6B5D4F",  // 15. Warm taupe
];

// All categories use the same color palette
const CATEGORY_COLOR_PALETTES: Record<FriendCategory, string[]> = {
  inner_circle: SHARED_COLOR_PALETTE,
  village: SHARED_COLOR_PALETTE,
  family: SHARED_COLOR_PALETTE,
  acquaintance: SHARED_COLOR_PALETTE,
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
