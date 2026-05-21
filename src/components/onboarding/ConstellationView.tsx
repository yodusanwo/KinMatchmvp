"use client";

import { MiniAvatar } from "./MiniAvatar";
import type { AvatarColor } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";

export type ConstellationFace = {
  id: string;
  name: string;
  avatarColor: AvatarColor;
};

/** Pentagon anchor positions (top, upper sides, lower sides). */
const PENTAGON_SLOTS: { top: string; left: string }[] = [
  { top: "4%", left: "50%" },
  { top: "28%", left: "18%" },
  { top: "28%", left: "82%" },
  { top: "62%", left: "28%" },
  { top: "62%", left: "72%" },
];

type ConstellationViewProps = {
  faces: ConstellationFace[];
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  heartBadge?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  compact?: boolean;
  className?: string;
};

export function ConstellationView({
  faces,
  selectable = false,
  selectedIds = [],
  heartBadge = false,
  avatarSize = "md",
  compact = false,
  onToggleSelect,
  className,
}: ConstellationViewProps) {
  const displayFaces = faces.slice(0, 5);
  const overflow = faces.length > 5 ? faces.slice(5) : [];

  if (compact) {
    return (
      <ul className={cn("flex flex-wrap items-start justify-center gap-8", className)}>
        {displayFaces.map((face) => (
          <li key={face.id} className="flex flex-col items-center gap-1.5">
            <MiniAvatar
              name={face.name}
              avatarColor={face.avatarColor}
              size={avatarSize}
            />
            <span className="max-w-[72px] truncate font-sans text-xs text-ink">
              {face.name.split(" ")[0]}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative mx-auto aspect-square w-full max-w-[300px]">
        {displayFaces.map((face, index) => {
          const slot = PENTAGON_SLOTS[index];
          if (!slot) return null;
          const selected = selectedIds.includes(face.id);

          return (
            <button
              key={face.id}
              type="button"
              disabled={!selectable}
              onClick={() => selectable && onToggleSelect?.(face.id)}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 transition-transform duration-250 ease-out",
                selectable && "cursor-pointer hover:scale-105",
                !selectable && "cursor-default"
              )}
              style={{ top: slot.top, left: slot.left }}
              aria-pressed={selectable ? selected : undefined}
              aria-label={
                selectable
                  ? `${selected ? "Deselect" : "Select"} ${face.name}`
                  : face.name
              }
            >
              <span className="relative">
                <MiniAvatar
                  name={face.name}
                  avatarColor={face.avatarColor}
                  size={avatarSize}
                  className={cn(
                    "ring-2 ring-transparent",
                    selected && selectable && "ring-terracotta"
                  )}
                />
                {heartBadge && selected && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-[10px] text-cream"
                    aria-hidden
                  >
                    ♥
                  </span>
                )}
              </span>
              <span className="max-w-[72px] truncate font-sans text-xs text-ink">
                {face.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {overflow.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-3">
          {overflow.map((face) => {
            const selected = selectedIds.includes(face.id);
            return (
              <li key={face.id}>
                <button
                  type="button"
                  disabled={!selectable}
                  onClick={() => selectable && onToggleSelect?.(face.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-2 py-1",
                    selected
                      ? "border-terracotta bg-terracotta/10"
                      : "border-ink/20"
                  )}
                >
                  <MiniAvatar
                    name={face.name}
                    avatarColor={face.avatarColor}
                    size="sm"
                  />
                  <span className="font-sans text-xs text-ink">{face.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
