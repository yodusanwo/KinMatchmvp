"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mic } from "lucide-react";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";
import type { MemoryNote, TodayDailyState } from "@/lib/api/types";
import type { ExtractedMemoryCandidate } from "@/lib/memories/types";
import { fetchJson } from "@/lib/api/fetch-client";
import { cn } from "@/lib/cn";

type SendSpotlightProps = {
  state: Extract<TodayDailyState, { kind: "send_discovery" | "send_algorithmic" }>;
};

type CaptureSpotlightProps = {
  state: Extract<TodayDailyState, { kind: "capture" }>;
  onRefresh: () => void;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function cadenceStatus(daysQuiet: number) {
  if (daysQuiet === 0) return "on rhythm";
  if (daysQuiet === 1) return "1 day quiet";
  return `${daysQuiet} days quiet`;
}

function sendQuestion(state: SendSpotlightProps["state"]) {
  return state.kind === "send_discovery"
    ? state.prompt.question
    : state.personalized_prompt;
}

function whyItWorks(state: SendSpotlightProps["state"]) {
  return state.kind === "send_discovery"
    ? state.prompt.why_it_works
    : state.primary_reason;
}

export function SendSpotlight({ state }: SendSpotlightProps) {
  const name = firstName(state.friend.name);
  const question = sendQuestion(state);
  const voiceNoteHref =
    state.kind === "send_discovery"
      ? `/api/discovery/outreach?friend_id=${state.friend.id}&day=${state.day_number}`
      : `/friends/${state.friend.id}/voice-note`;

  return (
    <article className="rounded-3xl bg-cream-deep/80 p-4">
      <Link
        href={`/friends/${state.friend.id}`}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <MiniAvatar
          name={state.friend.name}
          avatarColor={state.friend.avatar_color}
          size="md"
        />
        <div>
          <p className="font-sans text-base font-semibold text-ink">{name}</p>
          <p className="font-sans text-xs text-ink-soft">
            {cadenceStatus(state.friend.days_quiet)}
          </p>
        </div>
      </Link>

      <p className="mt-4 font-inter text-sm italic leading-relaxed text-ink">
        “{question}”
      </p>
      <p className="mt-3 font-inter text-xs italic leading-relaxed text-ink-soft">
        {whyItWorks(state)}
      </p>

      <Link
        href={voiceNoteHref}
        className={cn(primaryButtonClassName, "mt-5 gap-2")}
      >
        <Mic className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Send a voice note
      </Link>
      <p className="mt-3 text-center">
        <Link
          href={`/friends/${state.friend.id}`}
          className="font-inter text-xs text-terracotta underline decoration-terracotta/60 underline-offset-2"
        >
          view {name}&apos;s profile
        </Link>
      </p>
    </article>
  );
}

export function CaptureSpotlight({ state, onRefresh }: CaptureSpotlightProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "extracting" | "reviewing" | "saving" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ExtractedMemoryCandidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const name = firstName(state.friend.name);

  const canSubmit = text.trim().length >= 2 && status !== "extracting" && status !== "saving";
  const selectedCandidates = useMemo(
    () => candidates.filter((_, index) => selected.has(index)),
    [candidates, selected]
  );

  async function beginCapture() {
    if (!canSubmit) return;
    setStatus("extracting");
    setError(null);

    const extraction = await fetchJson<{ candidates: ExtractedMemoryCandidate[] }>(
      "/api/extract-memories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friend_id: state.friend.id,
          conversation_text: text,
        }),
      }
    );

    if (!extraction.ok || extraction.data.candidates.length === 0) {
      setCandidates([{ text: text.trim(), category: "current" }]);
      setSelected(new Set([0]));
      setStatus("reviewing");
      if (!extraction.ok) {
        setError("Using your typed note directly for now.");
      }
      return;
    }

    setCandidates(extraction.data.candidates);
    setSelected(new Set(extraction.data.candidates.map((_, index) => index)));
    setStatus("reviewing");
  }

  async function saveCapture() {
    const notes = selectedCandidates.length > 0
      ? selectedCandidates
      : [{ text: text.trim(), category: "current" as const }];
    if (notes.some((note) => note.text.trim().length < 2)) return;

    setStatus("saving");
    setError(null);

    for (const note of notes) {
      const saved = await fetchJson<MemoryNote>(
        `/api/friends/${state.friend.id}/memories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: note.text,
            category: note.category,
            event_date: note.event_date,
          }),
        }
      );

      if (!saved.ok) {
        setStatus("error");
        setError(saved.error);
        return;
      }
    }

    const captured = await fetchJson<{ success: boolean }>(
      `/api/capture-prompts/${state.interaction_id}/capture`,
      { method: "POST" }
    );

    if (!captured.ok) {
      setStatus("error");
      setError(captured.error);
      return;
    }

    onRefresh();
  }

  async function skipCapture() {
    setStatus("saving");
    await fetch(`/api/capture-prompts/${state.interaction_id}/dismiss`, {
      method: "POST",
    });
    onRefresh();
  }

  return (
    <article className="rounded-3xl bg-cream-deep/80 p-4">
      <div className="flex items-center gap-3">
        <MiniAvatar
          name={state.friend.name}
          avatarColor={state.friend.avatar_color}
          size="md"
        />
        <div>
          <p className="font-sans text-base font-semibold text-ink">{name}</p>
          <p className="font-sans text-xs text-ink-soft">
            voice note sent yesterday
          </p>
        </div>
      </div>

      <p className="mt-4 font-inter text-sm italic leading-relaxed text-ink-soft">
        You asked: “{state.original_question}”
      </p>
      <p className="mt-4 font-sans text-sm font-semibold leading-relaxed text-ink">
        What did {name} say? Type or voice-note what you learned.
      </p>

      <div className="mt-4 rounded-2xl border border-dashed border-ink/[0.18] bg-cream/45 p-4 text-center">
        <Mic className="mx-auto h-5 w-5 text-ink-soft" strokeWidth={1.75} />
        <p className="mt-2 font-inter text-xs italic text-ink-soft">
          tap to record · or type below
        </p>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={`What did ${name} share?`}
        className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-ink/[0.12] bg-cream px-3 py-3 font-inter text-sm italic leading-relaxed text-ink placeholder:text-ink-soft/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
      />

      {status === "reviewing" && (
        <div className="mt-3 space-y-2">
          {candidates.map((candidate, index) => (
            <label
              key={`${candidate.text}-${index}`}
              className="flex gap-2 rounded-xl bg-cream/70 px-3 py-2 font-inter text-xs italic leading-relaxed text-ink"
            >
              <input
                type="checkbox"
                checked={selected.has(index)}
                onChange={() => {
                  setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  });
                }}
                className="mt-0.5"
              />
              <span>{candidate.text}</span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 font-inter text-xs italic text-terracotta-deep">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit && status !== "reviewing"}
        onClick={() => {
          if (status === "reviewing") void saveCapture();
          else void beginCapture();
        }}
        className={cn(primaryButtonClassName, "mt-4 w-full disabled:opacity-50")}
      >
        {status === "extracting"
          ? "Finding memories…"
          : status === "reviewing"
            ? `Save to ${name}'s profile →`
            : status === "saving"
              ? "Saving…"
              : `Save to ${name}'s profile →`}
      </button>

      <button
        type="button"
        disabled={status === "saving"}
        onClick={() => void skipCapture()}
        className="mt-3 block w-full text-center font-inter text-xs text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:opacity-50"
      >
        they haven&apos;t responded yet
      </button>
    </article>
  );
}
