import type { FriendCategory } from "@/lib/api/types";

// Expanded color palettes with more variety for each category
const CATEGORY_COLOR_PALETTES: Record<FriendCategory, string[]> = {
  inner_circle: [
    "#FF9B82",  // Bright coral
    "#E67D64",  // Deep coral
    "#FFB399",  // Peachy coral
    "#FF8C72",  // Warm coral  
    "#F5A582",  // Soft coral
    "#FF7F6E",  // Vivid coral
    "#E8968A",  // Muted coral
    "#FFA890",  // Light coral
    "#E89470",  // Salmon coral
    "#D4926A",  // Earthy coral
  ],
  village: [
    "#6B7A5C",  // Sage olive
    "#7B8A6C",  // Light olive
    "#5D6C4E",  // Deep olive
    "#738269",  // Muted olive
    "#677656",  // Earthy olive
    "#8A9B7A",  // Soft olive
    "#5E6D50",  // Dark olive
    "#7C8B6D",  // Medium olive
    "#6A7959",  // Warm olive
    "#788870",  // Pale olive
  ],
  family: [
    "#D4A356",  // Gold
    "#C68F3E",  // Deep gold
    "#E8BA6F",  // Light gold
    "#DCA850",  // Warm gold
    "#CFAB5C",  // Soft gold
    "#E0B45A",  // Bright gold
    "#C9A248",  // Rich gold
    "#DDAE62",  // Mellow gold
    "#D4A67C",  // Tan gold
    "#CC9E70",  // Bronze gold
  ],
  acquaintance: [
    "#C8A882",  // Warm beige
    "#D4B896",  // Light tan
    "#B89968",  // Bronze tan
    "#E0C4A0",  // Pale beige
    "#C09864",  // Golden tan
    "#D8BC94",  // Soft tan
    "#B8A078",  // Earthy beige
    "#CCAC80",  // Warm sand
    "#D0B488",  // Desert tan
    "#BC9C70",  // Rustic tan
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
