import { NameChip } from "./NameChip";
import type { PersonChip } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";

type NameChipListProps = {
  people: PersonChip[];
  onRemove: (id: string) => void;
  className?: string;
};

export function NameChipList({ people, onRemove, className }: NameChipListProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {people.map((person) => (
        <li key={person.id}>
          <NameChip person={person} onRemove={onRemove} />
        </li>
      ))}
    </ul>
  );
}
