"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type AddNameInputProps = {
  placeholder: string;
  onAdd: (name: string) => boolean;
  /** Return a message to block add (shown instead of the default duplicate copy). */
  getAddError?: (name: string) => string | null;
  className?: string;
};

export function AddNameInput({
  placeholder,
  onAdd,
  getAddError,
  className,
}: AddNameInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setError("Use at least 3 characters");
      return;
    }
    const blocked = getAddError?.(trimmed);
    if (blocked) {
      setError(blocked);
      return;
    }
    const added = onAdd(trimmed);
    if (!added) {
      setError("Already in your list");
      return;
    }
    setValue("");
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
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
      {error && (
        <p className="font-inter text-xs italic text-terracotta-deep">{error}</p>
      )}
    </form>
  );
}
