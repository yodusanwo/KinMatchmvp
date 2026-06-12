import { MiniAvatar } from "./MiniAvatar";
import type { PersonChip } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";

type NameChipProps = {
  person: PersonChip;
  onRemove: (id: string) => void;
  className?: string;
};

export function NameChip({ person, onRemove, className }: NameChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-hairline bg-cream py-1.5 pl-1.5 pr-2",
        className
      )}
    >
      <MiniAvatar name={person.name} avatarColor={person.avatarColor} />
      <span className="font-sans text-sm text-ink">{person.name}</span>
      <button
        type="button"
        onClick={() => onRemove(person.id)}
        className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/10 hover:text-ink"
        aria-label={`Remove ${person.name}`}
      >
        ×
      </button>
    </span>
  );
}
