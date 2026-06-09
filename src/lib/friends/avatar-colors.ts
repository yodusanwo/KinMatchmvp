import type { FriendCategory } from "@/lib/api/types";

// All categories use the same vibrant, highly distinct 15-color palette
// Colors are saturated and maximally distinct for clear visual differentiation
const SHARED_COLOR_PALETTE = [
  "#FF9B82",  // Bright coral (matches button color)
  "#F4C542",  // Bright golden yellow
  "#2F4F32",  // Deep forest green
  "#D65745",  // Vibrant red
  "#E8A448",  // Bright amber
  "#6B8E4E",  // Olive green
  "#8E3D22",  // Deep burgundy
  "#FFD670",  // Sunny yellow
  "#A0522D",  // Sienna brown
  "#C85A3E",  // Bright terracotta
  "#B8860B",  // Dark golden rod
  "#4A6741",  // Hunter green
  "#E67D64",  // Warm salmon
  "#D2691E",  // Chocolate
  "#7A8B4F",  // Yellow green
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
