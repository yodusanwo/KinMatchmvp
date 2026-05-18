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

/** Add any Q1 people missing from Q2 (by name). */
export function mergeQ1IntoQ2(
  q1People: PersonChip[],
  q2People: PersonChip[]
): PersonChip[] {
  const merged = [...q2People];
  for (const person of q1People) {
    if (!hasPersonNamed(merged, person.name)) {
      merged.push({ ...person });
    }
  }
  return merged;
}
