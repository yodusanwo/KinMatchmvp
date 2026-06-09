import type { FriendCategory } from "@/lib/api/types";

// All categories use the same vibrant, highly distinct 15-color palette
const SHARED_COLOR_PALETTE = [
  "#B65232",  // Terracotta red
  "#D4A356",  // Bright gold
  "#2F4032",  // Deep forest green
  "#E67D64",  // Coral salmon
  "#C68F3E",  // Mustard yellow
  "#6B7A5C",  // Sage green
  "#8E3D22",  // Deep burgundy
  "#E8D494",  // Honey yellow
  "#5D6C4E",  // Olive green
  "#D97B4F",  // Burnt orange
  "#A89668",  // Golden tan
  "#3F4F42",  // Dark pine
  "#C85A3E",  // Bright terracotta
  "#DCA850",  // Warm gold
  "#788870",  // Muted green
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
