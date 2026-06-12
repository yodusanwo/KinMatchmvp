"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/brand";
import { OptionalPhoneField } from "@/components/friends/OptionalPhoneField";
import { formatDisplayName } from "@/lib/names/format";

type FriendPhoneSectionProps = {
  friendId: string;
  friendName: string;
  phoneNumber: string | null;
  onSaved: (phoneNumber: string | null) => void;
  onToast: (message: string) => void;
};

export function FriendPhoneSection({
  friendId,
  friendName,
  phoneNumber,
  onSaved,
  onToast,
}: FriendPhoneSectionProps) {
  const name = formatDisplayName(friendName);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function savePhone(nextValue: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: nextValue }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        phone_number?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't save, try again.");
      }
      onSaved(data.phone_number ?? null);
      setValue(data.phone_number ?? "");
      setEditing(false);
      onToast(data.phone_number ? "Saved." : "Removed.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save, try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!editing && !phoneNumber) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => {
            setValue("");
            setEditing(true);
          }}
          className="font-inter text-sm italic text-terracotta underline decoration-terracotta/60 underline-offset-2"
        >
          Add {name}&apos;s phone number for one-tap sending →
        </button>
      </div>
    );
  }

  if (!editing && phoneNumber) {
    return (
      <div className="mt-4 space-y-1">
        <p className="font-sans text-xs text-ink-soft">Phone for one-tap send</p>
        <p className="font-mono text-sm text-ink">{phoneNumber}</p>
        <button
          type="button"
          onClick={() => {
            setValue(phoneNumber);
            setEditing(true);
          }}
          className="font-inter text-xs text-terracotta underline decoration-terracotta/60 underline-offset-2"
        >
          Edit number
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-ink/[0.12] bg-cream-deep/50 p-4">
      <OptionalPhoneField
        friendName={friendName}
        value={value}
        onChange={setValue}
        id={`friend-phone-${friendId}`}
      />
      <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
        {name}&apos;s number stays on their KinMatch profile. KinMatch never
        texts them, it just lets your phone auto-fill when you send.
      </p>
      {error && (
        <p className="font-inter text-xs italic text-terracotta-deep" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <PrimaryButton
          type="button"
          disabled={saving}
          onClick={() => void savePhone(value)}
          className="!py-2.5 text-sm"
        >
          {saving ? "Saving…" : "Save"}
        </PrimaryButton>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setEditing(false);
            setValue(phoneNumber ?? "");
            setError(null);
          }}
          className="rounded-sm px-4 py-2.5 font-sans text-sm text-ink-soft underline underline-offset-2"
        >
          Cancel
        </button>
        {phoneNumber && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void savePhone("")}
            className="rounded-sm px-4 py-2.5 font-sans text-sm text-terracotta-deep underline underline-offset-2"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
