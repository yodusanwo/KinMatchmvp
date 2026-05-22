import { parsePhoneNumber } from "libphonenumber-js";

export function normalizePhone(
  input: string,
  defaultCountry: "US" = "US"
): string | null {
  if (!input?.trim()) return null;
  try {
    const phone = parsePhoneNumber(input.trim(), defaultCountry);
    if (phone?.isValid()) return phone.format("E.164");
  } catch {
    // fall through
  }
  return input.trim();
}

export function isLikelyInvalidPhone(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const digitCount = trimmed.replace(/\D/g, "").length;
  return digitCount < 7;
}
