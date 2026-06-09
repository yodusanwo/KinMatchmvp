import type { FriendCategory } from "@/lib/api/types";

// Maximally distinct warm earth tones - matching the app's aesthetic
// Highly saturated colors spanning red/orange/yellow/green/brown families
const SHARED_COLOR_PALETTE = [
  "#D65745",  // Vibrant red
  "#FF9B82",  // Bright coral (button color)
  "#FF8C42",  // Bright orange
  "#F4C542",  // Golden yellow
  "#C68F3E",  // Mustard
  "#B8860B",  // Dark gold
  "#D4A356",  // Amber
  "#A8B560",  // Lime green
  "#6B8E4E",  // Olive green
  "#4A8B57",  // Emerald green
  "#2F4F32",  // Deep forest
  "#8E3D22",  // Deep burgundy
  "#A0522D",  // Sienna brown
  "#B65232",  // Terracotta
  "#8B7355",  // Warm brown
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
