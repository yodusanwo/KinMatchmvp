import type { FriendCategory } from "@/lib/api/types";

// All categories use the same diverse 30-color palette for maximum distinction
const SHARED_COLOR_PALETTE = [
  "#B65232",  // Terracotta red
  "#6B7A5C",  // Sage olive
  "#C68F3E",  // Mustard gold
  "#E8D494",  // Honey yellow
  "#8E3D22",  // Deep terracotta
  "#2F4032",  // Forest green
  "#D4A356",  // Gold
  "#7B8A6C",  // Light sage
  "#B07D4E",  // Bronze
  "#9DB58A",  // Soft green
  "#A67C52",  // Tan
  "#E0B45A",  // Bright gold
  "#5D6C4E",  // Deep olive
  "#D8B896",  // Light tan
  "#738269",  // Muted olive
  "#C89058",  // Amber
  "#8A7859",  // Khaki
  "#E8BA6F",  // Pale gold
  "#6A7959",  // Moss green
  "#BC9C70",  // Rustic tan
  "#A89668",  // Caramel
  "#788870",  // Sage gray
  "#D4A67C",  // Warm beige
  "#677656",  // Olive drab
  "#C8A882",  // Sand
  "#9B8965",  // Earth brown
  "#E0C4A0",  // Cream tan
  "#7C8B6D",  // Faded green
  "#B8977A",  // Taupe
  "#8E9B7A",  // Soft olive
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
