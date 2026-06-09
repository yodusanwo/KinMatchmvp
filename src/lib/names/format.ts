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

/**
 * Format name for display as "First Last-Initial" to distinguish people with same first names.
 * "Mary Johnson" → "Mary J"
 * "Mary" → "Mary"
 * "John Paul Smith" → "John Smith" (keeps middle name, uses last initial)
 */
export function formatDisplayName(name: string): string {
  const formatted = formatPersonName(name);
  const parts = formatted.split(" ").filter(Boolean);
  
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]; // Just first name
  if (parts.length === 2) {
    // "First Last" → "First L"
    return `${parts[0]} ${parts[1][0]}`;
  }
  
  // Three or more parts: "First Middle Last" → "First M Last" or "First Last"
  // Keep the last name, use first letter of second-to-last
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  // If last name is just one letter already, show as is
  if (lastName.length === 1) {
    return `${firstName} ${lastName}`;
  }
  
  // Use first letter of last name
  return `${firstName} ${lastName[0]}`;
}
