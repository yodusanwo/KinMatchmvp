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
              "rounded-full border px-4 py-3 text-left font-sans text-sm transition-colors duration-250 ease-out",
              isSelected
                ? "border-terracotta bg-terracotta/10 text-ink"
                : "border-ink/[0.35] bg-transparent text-ink-soft hover:border-ink/[0.5] hover:text-ink"
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
