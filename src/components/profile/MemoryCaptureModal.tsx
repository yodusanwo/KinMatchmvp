"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
} from "@/components/brand";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import type { AvatarColor } from "@/lib/onboarding/types";
import type { MemoryNote } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type MemoryCaptureModalProps = {
  open: boolean;
  friendId: string;
  friendName: string;
  avatarColor: AvatarColor;
  onClose: () => void;
  onSaved: (note: MemoryNote) => void;
};

export function MemoryCaptureModal({
  open,
  friendId,
  friendName,
  avatarColor,
  onClose,
  onSaved,
}: MemoryCaptureModalProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setText("");
    setStatus("idle");
    setErrorMessage(null);
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

  if (!open) return null;

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setStatus("saving");
    setErrorMessage(null);

    const res = await fetch(`/api/friends/${friendId}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setErrorMessage(
        (data as { error?: string }).error ??
          "Couldn't save that note. Try again in a moment."
      );
      return;
    }

    const note = (await res.json()) as MemoryNote;
    onSaved(note);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-cream"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-capture-title"
    >
      <BrandBar />
      <div className="flex items-center border-b border-ink/[0.12] px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="font-inter text-sm text-terracotta underline underline-offset-2"
        >
          ← Back
        </button>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-8 pt-6">
        <div className="flex items-center gap-3">
          <MiniAvatar name={friendName} avatarColor={avatarColor} size="sm" />
          <Eyebrow>A note about {friendName}</Eyebrow>
        </div>

        <div id="memory-capture-title">
          <Headline as="h2" className="mt-6">
            What&apos;s worth remembering?
          </Headline>
        </div>
        <Subhead className="mt-2">
          Anything small or specific. KinMatch will surface it at the right
          moment.
        </Subhead>

        <div className="relative mt-6 flex-1">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="She's training for a half marathon in October…"
            rows={8}
            className={cn(
              "min-h-[200px] w-full resize-none rounded-2xl border border-ink/[0.2] bg-cream-deep/60 px-4 py-4 pr-12",
              "font-inter text-base italic leading-relaxed text-ink placeholder:text-ink-soft/50",
              "focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
            )}
          />
          <button
            type="button"
            disabled
            title="Voice notes coming soon"
            className="absolute bottom-4 right-4 text-ink-soft/40"
            aria-label="Add note by voice (coming soon)"
          >
            <Mic className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <p className="mt-2 font-inter text-xs italic text-ink-soft">
          Tap the mic to add notes by voice instead — coming in a future update.
        </p>

        {errorMessage && (
          <p className="mt-3 font-inter text-sm italic text-terracotta-deep" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <PrimaryButton
            type="button"
            disabled={!text.trim() || status === "saving"}
            onClick={handleSave}
            className="w-full"
          >
            {status === "saving"
              ? "Saving…"
              : `Save to ${friendName}'s notes`}
          </PrimaryButton>
          <p className="text-center">
            <button
              type="button"
              onClick={onClose}
              className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2"
            >
              Cancel
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
