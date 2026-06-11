"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { OptionalPhoneField } from "@/components/friends/OptionalPhoneField";
import {
  MAX_AVATAR_INITIALS,
  SHARED_AVATAR_PALETTE,
  getAvatarTextColor,
  getFriendColor,
  getInitials,
  resolveFriendColor,
  resolveInitials,
  sanitizeInitials,
} from "@/lib/friends/avatar-colors";
import { cn } from "@/lib/cn";

type AvatarPatch = {
  avatar_color_hex?: string | null;
  avatar_initials?: string | null;
  phone_number?: string | null;
};

type AvatarColorPickerProps = {
  friendId: string;
  friendName: string;
  /** The currently saved color override, or null when using the auto color. */
  colorHex?: string | null;
  /** The currently saved initials override, or null when derived from the name. */
  initials?: string | null;
  /** The currently saved phone number, or null. */
  phoneNumber?: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: (patch: AvatarPatch) => void;
};

export function AvatarColorPicker({
  friendId,
  friendName,
  colorHex,
  initials,
  phoneNumber,
  open,
  onClose,
  onSaved,
}: AvatarColorPickerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialsDraft, setInitialsDraft] = useState(initials ?? "");
  const [phoneDraft, setPhoneDraft] = useState(phoneNumber ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    setInitialsDraft(initials ?? "");
  }, [initials, open]);

  useEffect(() => {
    setPhoneDraft(phoneNumber ?? "");
  }, [phoneNumber, open]);

  const currentColor = colorHex ?? null;
  const previewColor = resolveFriendColor(friendName, currentColor);
  const previewInitials = resolveInitials(
    friendName,
    initialsDraft || initials
  );
  const autoColor = getFriendColor(friendName);

  async function patch(update: AvatarPatch, previous: AvatarPatch) {
    if (saving) return false;
    setSaving(true);
    setError(null);
    onSaved(update); // optimistic

    const response = await fetch(`/api/friends/${friendId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });

    setSaving(false);

    if (!response.ok) {
      onSaved(previous); // revert
      setError("Couldn't save that — try again.");
      return false;
    }
    return true;
  }

  async function saveColor(next: string | null) {
    await patch({ avatar_color_hex: next }, { avatar_color_hex: currentColor });
  }

  async function saveInitials() {
    const cleaned = sanitizeInitials(initialsDraft).toUpperCase();
    const next = cleaned.length > 0 ? cleaned : null;
    if ((initials ?? null) === next) return;
    await patch({ avatar_initials: next }, { avatar_initials: initials ?? null });
  }

  async function savePhone() {
    const trimmed = phoneDraft.trim();
    if (trimmed === (phoneNumber ?? "")) return;
    setSavingPhone(true);
    setPhoneError(null);

    const response = await fetch(`/api/friends/${friendId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: trimmed }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      phone_number?: string | null;
      error?: string;
    };

    setSavingPhone(false);

    if (!response.ok) {
      setPhoneError(data.error ?? "Couldn't save that number — try again.");
      return;
    }

    onSaved({ phone_number: data.phone_number ?? null });
    setPhoneDraft(data.phone_number ?? "");
  }

  if (!open) return null;

  return (
    <div className="mt-3 w-full rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-sans text-sm font-medium"
          style={{
            backgroundColor: previewColor,
            color: getAvatarTextColor(previewColor),
          }}
          aria-hidden
        >
          {previewInitials}
        </span>
        <div className="min-w-0">
          <p className="font-sans text-sm font-medium text-ink">
            {friendName.split(/\s+/)[0]}&apos;s details
          </p>
          <p className="font-inter text-xs italic text-ink-soft">
            How they look, and how you reach them.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="avatar-initials"
          className="font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft"
        >
          Initials
        </label>
        <input
          id="avatar-initials"
          value={initialsDraft}
          onChange={(event) =>
            setInitialsDraft(sanitizeInitials(event.target.value).toUpperCase())
          }
          onBlur={() => void saveInitials()}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          maxLength={MAX_AVATAR_INITIALS}
          placeholder={getInitials(friendName)}
          className="mt-1.5 w-24 rounded-xl border border-ink/[0.2] bg-cream px-3 py-2 text-center font-sans text-base uppercase tracking-[0.1em] text-ink placeholder:text-ink-soft/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
        />
        <span className="ml-2 font-inter text-xs italic text-ink-soft">
          up to {MAX_AVATAR_INITIALS} — leave blank for {getInitials(friendName)}
        </span>
      </div>

      <p className="mt-4 font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft">
        Color
      </p>
      <div className="mt-2.5 flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          aria-label="Automatic color"
          onClick={() => void saveColor(null)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full font-sans text-[12px] font-medium ring-offset-2 ring-offset-cream-deep transition",
            currentColor === null && "ring-2 ring-ink"
          )}
          style={{
            backgroundColor: autoColor,
            color: getAvatarTextColor(autoColor),
          }}
        >
          {currentColor === null ? (
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          ) : (
            getInitials(friendName)
          )}
        </button>

        {SHARED_AVATAR_PALETTE.map((swatch) => {
          const selected = currentColor?.toUpperCase() === swatch.toUpperCase();
          return (
            <button
              key={swatch}
              type="button"
              aria-label={`Use ${swatch}`}
              onClick={() => void saveColor(swatch)}
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

      <div className="mt-4 border-t border-ink/[0.08] pt-4">
        <OptionalPhoneField
          friendName={friendName}
          value={phoneDraft}
          onChange={setPhoneDraft}
          onBlur={() => void savePhone()}
          id={`avatar-phone-${friendId}`}
        />
        {savingPhone && (
          <p className="mt-1 font-inter text-xs italic text-ink-soft">saving…</p>
        )}
        {phoneError && (
          <p className="mt-1 font-inter text-xs italic text-terracotta-deep" role="alert">
            {phoneError}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          void saveInitials();
          void savePhone();
          onClose();
        }}
        className="mt-4 block w-full text-center font-inter text-xs text-ink-soft underline underline-offset-2"
      >
        done
      </button>
    </div>
  );
}
