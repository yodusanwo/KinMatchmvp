import type { FriendCategory } from "@/lib/api/types";

export const FRIEND_CATEGORIES = [
  "inner_circle",
  "village",
  "family",
  "acquaintance",
] as const satisfies FriendCategory[];

export const CATEGORY_CADENCE_DAYS: Record<FriendCategory, number> = {
  inner_circle: 14,
  village: 30,
  family: 21,
  acquaintance: 60,
};

export function isFriendCategory(value: unknown): value is FriendCategory {
  return (
    typeof value === "string" &&
    (FRIEND_CATEGORIES as readonly string[]).includes(value)
  );
}

export function categoryActionLabel(category: FriendCategory) {
  const labels: Record<FriendCategory, string> = {
    inner_circle: "inner circle",
    village: "village",
    family: "family",
    acquaintance: "acquaintance",
  };
  return labels[category];
}

export function categoryToastLabel(category: FriendCategory) {
  return category === "acquaintance"
    ? "your acquaintances"
    : `your ${categoryActionLabel(category)}`;
}

export function categoryRelationshipLabel(category: FriendCategory) {
  const labels: Record<FriendCategory, string> = {
    inner_circle: "Inner circle",
    village: "Growing in your village",
    family: "Family",
    acquaintance: "An acquaintance",
  };
  return labels[category];
}
