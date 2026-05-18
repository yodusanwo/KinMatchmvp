"use client";

import { useEffect, useRef, useState } from "react";
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
import { fetchJson } from "@/lib/api/fetch-client";
import type { MemoryNote } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type MemoryCaptureModalProps = {
  open: boolean;
  friendId: string;
  friendName: string;
  avatarColor: AvatarColor;
  onClose: () => void;
  onSaved: (notes: MemoryNote[]) => void;
};

const textareaClassName = cn(
  "min-h-[200px] w-full resize-none rounded-2xl border border-ink/[0.2] bg-cream-deep/60 px-4 py-4",
  "font-inter text-base italic leading-relaxed text-ink placeholder:text-ink-soft/50",
  "focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
);

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
  const saveInFlight = useRef(false);

  useEffect(() => {
    if (!open) return;
    setText("");
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

  async function handleSaveNote() {
    const trimmed = text.trim();
    if (!trimmed || saveInFlight.current) return;

    saveInFlight.current = true;
    setStatus("saving");
    setErrorMessage(null);

    const result = await fetchJson<MemoryNote>(
      `/api/friends/${friendId}/memories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      }
    );

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      saveInFlight.current = false;
      return;
    }

    onSaved([result.data]);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-cream-deep">
      <div
        className="flex h-full w-full max-w-[480px] flex-col bg-cream shadow-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-capture-title"
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

          <div className="relative mt-6">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="She's training for a half marathon in October…"
              rows={8}
              className={cn(textareaClassName, "pr-12")}
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
              disabled={!text.trim() || status === "saving"}
              onClick={() => void handleSaveNote()}
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
