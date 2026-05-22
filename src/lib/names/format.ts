/** Collapse whitespace and title-case each word (and hyphenated parts). */
function capitalizePart(part: string): string {
  const trimmed = part.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function capitalizeToken(token: string): string {
  return token.split("-").map(capitalizePart).join("-");
}

/**
 * Normalize a person name for storage and display.
 * "mary" → "Mary", "MARY JANE" → "Mary Jane", "  o'brien  " → "O'brien"
 */
export function formatPersonName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, " ");
  if (!collapsed) return collapsed;
  return collapsed.split(" ").map(capitalizeToken).join(" ");
}
