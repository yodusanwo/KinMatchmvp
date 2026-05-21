"use client";

import { Circle, CircleDot, Trash2, Users } from "lucide-react";
import type { FriendCategory, FriendProfile } from "@/lib/api/types";
import {
  categoryActionLabel,
  FRIEND_CATEGORIES,
} from "@/lib/friends/categories";

type FriendManagementSheetProps = {
  open: boolean;
  mode: "actions" | "confirm-remove";
  friend: Pick<FriendProfile, "name" | "category">;
  saving?: boolean;
  onClose: () => void;
  onRecategorize: (category: FriendCategory) => void;
  onStartRemove: () => void;
  onConfirmRemove: () => void;
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
  onStartRemove,
  onConfirmRemove,
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
              about {name.toLowerCase()}
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
              onClick={onStartRemove}
              disabled={saving}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-ink/[0.04] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 text-terracotta-deep" aria-hidden />
              <span className="font-sans text-base font-semibold text-terracotta-deep">
                Remove from KinMatch
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
              Remove {name} from KinMatch?
            </h2>
            <p className="font-inter text-xs italic leading-[1.5] text-[rgba(31,26,20,0.75)]">
              This will hide {name}&apos;s profile and the notes you&apos;ve
              saved about them. KinMatch will no longer suggest reaching out to
              them.
            </p>
            <p className="font-inter text-[11px] italic leading-[1.5] text-[rgba(31,26,20,0.55)]">
              Voice notes you&apos;ve already sent will remain on their share
              links — only your profile data is hidden.
            </p>
            <button
              type="button"
              onClick={onConfirmRemove}
              disabled={saving}
              className="w-full rounded-full bg-terracotta-deep px-6 py-3.5 font-sans text-sm font-semibold text-cream disabled:opacity-50"
            >
              {saving ? "Removing…" : `Remove ${name}`}
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
