import { randomAvatarColor } from "./avatar-colors";
import type { PersonChip } from "./types";

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

/** Reveal: inner circle = all of Q1; growing closer = all of Q2 (both sections always). */
export function splitReflectionRevealGroups(
  q1People: PersonChip[],
  q2People: PersonChip[]
): { innerCircle: PersonChip[]; growingCloser: PersonChip[] } {
  return {
    innerCircle: q1People,
    growingCloser: q2People,
  };
}

export function formatRevealSubhead(
  innerCount: number,
  growingCount: number
): string {
  if (innerCount > 0 && growingCount > 0) {
    const close =
      innerCount === 1
        ? "One person you're close to"
        : `${innerCount} people you're close to`;
    const growing =
      growingCount === 1
        ? "one you want to grow closer with"
        : `${growingCount} you want to grow closer with`;
    return `${close} — and ${growing}.`;
  }
  if (growingCount > 0) {
    return growingCount === 1
      ? "One person you want to grow closer with."
      : `${growingCount} people you want to grow closer with.`;
  }
  return innerCount === 1
    ? "One person you've chosen to invest in."
    : `${innerCount} people you've chosen to invest in.`;
}
