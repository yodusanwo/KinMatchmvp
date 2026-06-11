// A single, shared palette used for every friend avatar across the whole app.
// One friend = one color, everywhere. Colors are chosen to be maximally
// distinct from one another so people in your tribe are easy to tell apart.
export const SHARED_AVATAR_PALETTE = [
  "#D9534F", // red
  "#E07B39", // orange
  "#E0A93E", // amber
  "#9CA63E", // olive
  "#5FA85B", // green
  "#3FA89B", // teal
  "#3E9BC9", // cyan
  "#4F7FD9", // blue
  "#6366D9", // indigo
  "#8A5CD9", // violet
  "#A94FC9", // purple
  "#D14FA8", // magenta
  "#E0689B", // pink
  "#A9745A", // brown
  "#6E8AA6", // slate
] as const;

/**
 * Deterministic string hash (FNV-1a). Stable across pages and sessions, and
 * distributes similar strings (e.g. "Mary B" vs "Mark B") to different buckets.
 */
function hashString(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Returns a consistent color for a friend, seeded by a stable key (their name).
 * The same seed always maps to the same color, on every page of the app.
 */
export function getFriendColor(seed: string): string {
  const key = seed?.trim() || "?";
  return SHARED_AVATAR_PALETTE[hashString(key) % SHARED_AVATAR_PALETTE.length];
}

/**
 * Pick a legible text color (dark ink or white) for a given background, based
 * on its perceived luminance, so initials stay readable on every swatch.
 */
export function getAvatarTextColor(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Relative luminance (sRGB approximation)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1F1A14" : "#FFFFFF";
}

/**
 * Get initials from a name.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}
