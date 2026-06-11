"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  SHARED_AVATAR_PALETTE,
  getAvatarTextColor,
  getFriendColor,
  getInitials,
} from "@/lib/friends/avatar-colors";
import { cn } from "@/lib/cn";

type AvatarColorPickerProps = {
  friendId: string;
  friendName: string;
  /** The currently saved override, or null when using the auto color. */
  colorHex?: string | null;
  onSaved: (colorHex: string | null) => void;
};

export function AvatarColorPicker({
  friendId,
  friendName,
  colorHex,
  onSaved,
}: AvatarColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoColor = getFriendColor(friendName);
  const current = colorHex ?? null;

  async function save(next: string | null) {
    if (saving) return;
    setSaving(true);
    setError(null);

    const previous = current;
    onSaved(next); // optimistic

    const response = await fetch(`/api/friends/${friendId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_color_hex: next }),
    });

    setSaving(false);

    if (!response.ok) {
      onSaved(previous); // revert
      setError("Couldn't save that color — try again.");
      return;
    }

    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 font-inter text-xs text-terracotta underline decoration-terracotta/60 underline-offset-2"
      >
        change {friendName.split(/\s+/)[0]}&apos;s color
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4">
      <p className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink-soft">
        Pick a color
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2.5">
        {/* Auto / default color */}
        <button
          type="button"
          aria-label="Automatic color"
          onClick={() => void save(null)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full font-sans text-[12px] font-medium ring-offset-2 ring-offset-cream-deep transition",
            current === null && "ring-2 ring-ink"
          )}
          style={{
            backgroundColor: autoColor,
            color: getAvatarTextColor(autoColor),
          }}
        >
          {current === null ? (
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          ) : (
            getInitials(friendName)
          )}
        </button>

        {SHARED_AVATAR_PALETTE.map((swatch) => {
          const selected = current?.toUpperCase() === swatch.toUpperCase();
          return (
            <button
              key={swatch}
              type="button"
              aria-label={`Use ${swatch}`}
              onClick={() => void save(swatch)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-cream-deep transition",
                selected && "ring-2 ring-ink"
              )}
              style={{ backgroundColor: swatch }}
            >
              {selected && (
                <Check
                  className="h-4 w-4"
                  strokeWidth={2.5}
                  style={{ color: getAvatarTextColor(swatch) }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-center font-inter text-xs italic text-terracotta-deep">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-3 block w-full text-center font-inter text-xs text-ink-soft underline underline-offset-2"
      >
        done
      </button>
    </div>
  );
}
