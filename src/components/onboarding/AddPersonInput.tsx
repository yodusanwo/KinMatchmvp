"use client";

import { useState } from "react";
import { OptionalPhoneField } from "@/components/friends/OptionalPhoneField";
import { cn } from "@/lib/cn";

type AddPersonInputProps = {
  placeholder: string;
  onAdd: (name: string, phone: string) => boolean;
  getAddError?: (name: string) => string | null;
  className?: string;
};

export function AddPersonInput({
  placeholder,
  onAdd,
  getAddError,
  className,
}: AddPersonInputProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setError("Use at least 3 characters");
      return;
    }
    const blocked = getAddError?.(trimmed);
    if (blocked) {
      setError(blocked);
      return;
    }
    const added = onAdd(trimmed, phone);
    if (!added) {
      setError("Already in your list");
      return;
    }
    setName("");
    setPhone("");
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 rounded-xl border border-ink/[0.35] bg-cream px-4 py-3 font-inter text-base italic text-ink",
            "placeholder:text-ink-soft/70 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
          )}
          aria-label={placeholder}
        />
        <button
          type="submit"
          className="shrink-0 rounded-full border border-ink/[0.35] px-4 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-cream-deep"
        >
          Add
        </button>
      </div>

      {name.trim().length >= 2 && (
        <OptionalPhoneField
          friendName={name}
          value={phone}
          onChange={setPhone}
          id="onboarding-person-phone"
        />
      )}

      {error && (
        <p className="font-inter text-xs italic text-terracotta-deep">{error}</p>
      )}
    </form>
  );
}
