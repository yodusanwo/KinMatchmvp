"use client";

import { Archive, Circle, CircleDot, Users } from "lucide-react";
import type { FriendCategory, FriendProfile } from "@/lib/api/types";
import {
  categoryActionLabel,
  FRIEND_CATEGORIES,
} from "@/lib/friends/categories";

type FriendManagementSheetProps = {
  open: boolean;
  mode: "actions" | "confirm-archive";
  friend: Pick<FriendProfile, "name" | "category">;
  saving?: boolean;
  onClose: () => void;
  onRecategorize: (category: FriendCategory) => void;
  onStartArchive: () => void;
  onConfirmArchive: () => void;
};

const CATEGORY_ICONS: Record<FriendCategory, typeof Circle> = {
  inner_circle: CircleDot,
  village: Users,
  acquaintance: Circle,
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function FriendManagementSheet({
  open,
  mode,
  friend,
  saving = false,
  onClose,
  onRecategorize,
  onStartArchive,
  onConfirmArchive,
}: FriendManagementSheetProps) {
  if (!open) return null;

  const name = firstName(friend.name);
  const availableCategories = FRIEND_CATEGORIES.filter(
    (category) => category !== friend.category
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 px-3 pb-3">
      <div className="w-full max-w-[456px] rounded-[28px] bg-cream p-5 shadow-2xl">
        {mode === "actions" ? (
          <>
            <p className="mb-5 text-center font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">
              about {name}
            </p>

            <div className="space-y-1">
              {availableCategories.map((category) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onRecategorize(category)}
                    disabled={saving}
                    className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-ink/[0.04] disabled:opacity-50"
                  >
                    <Icon className="h-4 w-4 text-ink-soft" aria-hidden />
                    <span className="font-sans text-base font-semibold text-ink">
                      Move to {categoryActionLabel(category)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="my-4 h-px bg-ink/[0.12]" />

            <button
              type="button"
              onClick={onStartArchive}
              disabled={saving}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-ink/[0.04] disabled:opacity-50"
            >
              <Archive className="h-4 w-4 text-terracotta-deep" aria-hidden />
              <span className="font-sans text-base font-semibold text-terracotta-deep">
                Archive {name}
              </span>
            </button>

            <div className="my-4 h-px bg-ink/[0.12]" />

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl px-4 py-3 text-center font-sans text-base font-semibold text-ink/60 transition-colors hover:bg-ink/[0.04]"
            >
              Cancel
            </button>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="font-sans text-xl font-medium text-ink">
              Archive {name}?
            </h2>
            <p className="font-inter text-xs italic leading-[1.5] text-[rgba(31,26,20,0.75)]">
              Archiving hides {name}&apos;s profile and notes from your active
              tribe. You can restore them anytime from the archived section.
              Their voice notes and shared links remain unchanged.
            </p>
            <button
              type="button"
              onClick={onConfirmArchive}
              disabled={saving}
              className="w-full rounded-full bg-terracotta-deep px-6 py-3.5 font-sans text-sm font-semibold text-cream disabled:opacity-50"
            >
              {saving ? "Archiving…" : `Archive ${name}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full rounded-full border border-ink/[0.2] px-6 py-3.5 font-sans text-sm font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
