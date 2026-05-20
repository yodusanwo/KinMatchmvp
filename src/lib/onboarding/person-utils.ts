import { randomAvatarColor } from "./avatar-colors";
import type { CircleId, PersonChip } from "./types";

export function createPerson(name: string): PersonChip {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    avatarColor: randomAvatarColor(),
  };
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function hasPersonNamed(people: PersonChip[], name: string): boolean {
  const n = normalizeName(name);
  return people.some((p) => normalizeName(p.name) === n);
}

/** Keep first chip per normalized name (avoids duplicate friend rows). */
export function dedupePeopleByName(people: PersonChip[]): PersonChip[] {
  const seen = new Set<string>();
  const result: PersonChip[] = [];
  for (const person of people) {
    const key = normalizeName(person.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(person);
  }
  return result;
}

/** Reveal and saving derive circles from the classification step. */
export function splitReflectionRevealGroups(
  people: PersonChip[],
  assignments: Record<string, CircleId>
): { innerCircle: PersonChip[]; village: PersonChip[]; acquaintances: PersonChip[] } {
  return {
    innerCircle: people.filter((person) => assignments[person.id] === "inner"),
    village: people.filter((person) => assignments[person.id] === "village"),
    acquaintances: people.filter(
      (person) => assignments[person.id] === "acquaintance"
    ),
  };
}

export function formatRevealSubhead(
  innerCount: number,
  villageCount: number
): string {
  if (innerCount > 0 && villageCount > 0) {
    const close =
      innerCount === 1
        ? "One person in your inner circle"
        : `${innerCount} people in your inner circle`;
    const village =
      villageCount === 1
        ? "one person in your village"
        : `${villageCount} people in your village`;
    return `${close} — and ${village}.`;
  }
  if (villageCount > 0) {
    return villageCount === 1
      ? "One person in your village."
      : `${villageCount} people in your village.`;
  }
  return innerCount === 1
    ? "One person in your inner circle."
    : `${innerCount} people in your inner circle.`;
}
