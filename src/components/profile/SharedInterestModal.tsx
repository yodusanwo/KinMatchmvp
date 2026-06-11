"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
} from "@/components/brand";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import type { SharedInterest } from "@/lib/api/types";
import { fetchJson } from "@/lib/api/fetch-client";
import type { AvatarColor } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";

type SharedInterestModalProps = {
  open: boolean;
  friendId: string;
  friendName: string;
  avatarColor?: AvatarColor;
  colorHex?: string | null;
  onClose: () => void;
  onSaved: (interest: SharedInterest) => void;
};

const suggestions = ["coffee", "walking", "TV shows", "parenting", "Other"];

export function SharedInterestModal({
  open,
  friendId,
  friendName,
  colorHex,
  onClose,
  onSaved,
}: SharedInterestModalProps) {
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveInFlight = useRef(false);

  useEffect(() => {
    if (!open) return;
    setLabel("");
    setStatus("idle");
    setErrorMessage(null);
    saveInFlight.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleSave() {
    const trimmed = label.trim();
    if (!trimmed || saveInFlight.current) return;

    saveInFlight.current = true;
    setStatus("saving");
    setErrorMessage(null);

    const result = await fetchJson<SharedInterest>(
      `/api/friends/${friendId}/interests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: trimmed }),
      }
    );

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      saveInFlight.current = false;
      return;
    }

    onSaved(result.data);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-cream-deep">
      <div
        className="flex h-full w-full max-w-[480px] flex-col bg-cream shadow-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-interest-title"
      >
        <BrandBar />
        <div className="flex items-center border-b border-ink/[0.12] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={status === "saving"}
            className="font-inter text-sm text-terracotta underline underline-offset-2 disabled:opacity-50"
          >
            ← Back
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-6">
          <div className="flex items-center gap-3">
            <MiniAvatar name={friendName} colorHex={colorHex} size="sm" />
            <Eyebrow>Shared with {friendName}</Eyebrow>
          </div>

          <div id="shared-interest-title">
            <Headline as="h2" className="mt-6">
              What do you both connect over?
            </Headline>
          </div>
          <Subhead className="mt-2">
            Add a shared interest, background, place, or thing you both care
            about.
          </Subhead>

          <label className="mt-6 block">
            <span className="sr-only">Shared interest</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="coffee, walking, parenting, same hometown…"
              maxLength={60}
              ref={inputRef}
              className={cn(
                "h-12 w-full rounded-2xl border border-ink/[0.2] bg-cream-deep/60 px-4",
                "font-inter text-base italic text-ink placeholder:text-ink-soft/50",
                "focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
              )}
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  if (suggestion === "Other") {
                    setLabel("");
                    window.setTimeout(() => inputRef.current?.focus(), 0);
                    return;
                  }
                  setLabel(suggestion);
                }}
                className="rounded-full border border-ink/[0.16] px-3 py-1 font-inter text-xs italic text-ink-soft transition-colors hover:border-terracotta/40 hover:text-terracotta"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {errorMessage && (
            <p
              className="mt-3 font-inter text-sm italic text-terracotta-deep"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-6 space-y-4">
            <PrimaryButton
              type="button"
              disabled={label.trim().length < 2 || status === "saving"}
              onClick={() => void handleSave()}
              className="w-full"
            >
              {status === "saving" ? "Saving…" : "Save shared interest"}
            </PrimaryButton>
            <p className="text-center">
              <button
                type="button"
                onClick={onClose}
                disabled={status === "saving"}
                className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
