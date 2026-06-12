"use client";

import { BARRIER_OPTIONS } from "@/lib/onboarding/barriers";
import type { BarrierId } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";

type BarrierPillGroupProps = {
  selected: BarrierId[];
  onToggle: (id: BarrierId) => void;
  className?: string;
};

export function BarrierPillGroup({
  selected,
  onToggle,
  className,
}: BarrierPillGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {BARRIER_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={cn(
              "rounded-sm border-2 px-4 py-3 text-left font-sans text-sm transition-colors duration-150 ease-out",
              isSelected
                ? "border-terracotta bg-terracotta/10 text-ink"
                : "border-hairline bg-transparent text-ink-soft hover:border-ink hover:text-ink"
            )}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
