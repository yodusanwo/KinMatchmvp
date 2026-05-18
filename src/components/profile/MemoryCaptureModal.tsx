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
import { fetchJson } from "@/lib/api/fetch-client";
import type { MemoryNote } from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics/events";
import type { ExtractedMemoryCandidate } from "@/lib/memories/types";
import { cn } from "@/lib/cn";

type CaptureMode = "note" | "paste";

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
  const [mode, setMode] = useState<CaptureMode>("note");
  const [text, setText] = useState("");
  const [conversation, setConversation] = useState("");
  const [candidates, setCandidates] = useState<ExtractedMemoryCandidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<
    "idle" | "saving" | "extracting" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("note");
    setText("");
    setConversation("");
    setCandidates([]);
    setSelected(new Set());
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

  function toggleCandidate(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleSaveNote() {
    const trimmed = text.trim();
    if (!trimmed) return;

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
      return;
    }

    const note = result.data;
    onSaved([note]);
    onClose();
  }

  async function handleExtract() {
    const trimmed = conversation.trim();
    if (trimmed.length < 20) {
      setErrorMessage(
        "Paste a bit more of the conversation so KinMatch has context."
      );
      return;
    }

    setStatus("extracting");
    setErrorMessage(null);
    setCandidates([]);
    setSelected(new Set());

    const result = await fetchJson<{ candidates: ExtractedMemoryCandidate[] }>(
      "/api/extract-memories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friend_id: friendId,
          conversation_text: trimmed,
        }),
      }
    );

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }

    const data = result.data;
    const list = data.candidates ?? [];

    if (list.length === 0) {
      setStatus("idle");
      setErrorMessage(
        "Nothing specific stood out. Try a longer thread or add a note manually."
      );
      return;
    }

    setCandidates(list);
    setSelected(new Set(list.map((_, index) => index)));
    setStatus("idle");
  }

  async function handleSaveSelected() {
    const chosen = candidates.filter((_, index) => selected.has(index));
    if (chosen.length === 0) return;

    setStatus("saving");
    setErrorMessage(null);

    const result = await fetchJson<MemoryNote | { memories: MemoryNote[] }>(
      `/api/friends/${friendId}/memories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memories: chosen.map((item) => ({
            text: item.text,
            tag: item.tag,
            event_date: item.event_date ?? null,
          })),
        }),
      }
    );

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }

    const data = result.data;
    const notes = "memories" in data ? data.memories : [data];
    trackEvent("capture_from_paste_used", { count: String(notes.length) });
    onSaved(notes);
    onClose();
  }

  if (!open) return null;

  const showingCandidates = mode === "paste" && candidates.length > 0;

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

      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-6">
        <div className="flex items-center gap-3">
          <MiniAvatar name={friendName} avatarColor={avatarColor} size="sm" />
          <Eyebrow>A note about {friendName}</Eyebrow>
        </div>

        <div
          className="mt-5 flex rounded-full border border-ink/[0.2] bg-cream-deep/50 p-1"
          role="tablist"
        >
          {(
            [
              { id: "note" as const, label: "Write a note" },
              { id: "paste" as const, label: "Paste a conversation" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => {
                setMode(tab.id);
                setErrorMessage(null);
              }}
              className={cn(
                "flex-1 rounded-full py-2 font-sans text-xs font-medium transition-colors",
                mode === tab.id
                  ? "bg-terracotta text-cream"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "note" ? (
          <>
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
          </>
        ) : showingCandidates ? (
          <>
            <Headline as="h2" className="mt-6">
              Save what matters
            </Headline>
            <Subhead className="mt-2">
              Tap to select memories for {friendName}. You can save some or all.
            </Subhead>
            <ul className="mt-6 space-y-3">
              {candidates.map((candidate, index) => {
                const isOn = selected.has(index);
                return (
                  <li key={`${candidate.text}-${index}`}>
                    <button
                      type="button"
                      onClick={() => toggleCandidate(index)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                        isOn
                          ? "border-terracotta bg-cream-deep/80"
                          : "border-ink/[0.15] bg-cream-deep/40 hover:border-ink/[0.3]"
                      )}
                    >
                      <p className="font-inter text-sm italic leading-relaxed text-ink">
                        {candidate.text}
                      </p>
                      <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                        {candidate.tag}
                        {candidate.event_date
                          ? ` · ${candidate.event_date}`
                          : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <Headline as="h2" className="mt-6">
              Paste a conversation
            </Headline>
            <Subhead className="mt-2">
              From iMessage, WhatsApp, or anywhere. KinMatch will pull out
              what&apos;s worth remembering.
            </Subhead>
            <textarea
              value={conversation}
              onChange={(event) => setConversation(event.target.value)}
              placeholder="Paste a text thread, WhatsApp message, or any conversation here…"
              rows={10}
              className={cn(textareaClassName, "mt-6 min-h-[240px]")}
            />
          </>
        )}

        {errorMessage && (
          <p
            className="mt-3 font-inter text-sm italic text-terracotta-deep"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {mode === "note" ? (
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
          ) : showingCandidates ? (
            <PrimaryButton
              type="button"
              disabled={selected.size === 0 || status === "saving"}
              onClick={() => void handleSaveSelected()}
              className="w-full"
            >
              {status === "saving"
                ? "Saving…"
                : `Save selected (${selected.size})`}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              type="button"
              disabled={
                conversation.trim().length < 20 || status === "extracting"
              }
              onClick={() => void handleExtract()}
              className="w-full"
            >
              {status === "extracting" ? "Extracting…" : "Extract memories"}
            </PrimaryButton>
          )}
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
