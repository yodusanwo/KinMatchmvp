"use client";

import Link from "next/link";
import { useState } from "react";
import { Mic } from "lucide-react";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";
import type { TodayDailyState } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { firstName } from "@/lib/memories/categories";

type SendSpotlightProps = {
  state: Extract<TodayDailyState, { kind: "send_discovery" | "send_algorithmic" }>;
  onRefresh: () => void;
};

type CaptureSpotlightProps = {
  state: Extract<TodayDailyState, { kind: "capture" }>;
  onRefresh: () => void;
};

function cadenceStatus(friend: SendSpotlightProps["state"]["friend"]) {
  if (!friend.last_touch_at) return "not reached out yet";
  // Changed from "reached out today" to "today" to avoid implying inbound communication
  // KinMatch can only track outbound interactions (voice notes sent through the app)
  if (friend.days_quiet === 0) return "today";
  if (friend.days_quiet === 1) return "1 day quiet";
  return `${friend.days_quiet} days quiet`;
}

function daysSince(iso: string) {
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  );
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

export function SendSpotlight({ state, onRefresh }: SendSpotlightProps) {
  const name = firstName(state.friend.name);
  const question = sendQuestion(state);
  const [skipping, setSkipping] = useState(false);
  const voiceNoteHref =
    state.kind === "send_discovery"
      ? `/api/discovery/outreach?friend_id=${state.friend.id}&day=${state.day_number}`
      : `/friends/${state.friend.id}/voice-note`;

  async function skipPrompt() {
    setSkipping(true);
    // Call defer endpoint which handles both discovery and algorithmic modes
    await fetch(`/api/discovery/defer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friend_id: state.friend.id,
        day_number: state.kind === "send_discovery" ? state.day_number : undefined,
      }),
    });
    // Small delay to ensure database write completes
    await new Promise(resolve => setTimeout(resolve, 500));
    onRefresh();
  }

  if (skipping) {
    return (
      <article className="rounded-3xl bg-cream-deep/80 p-4">
        <p className="font-inter text-sm italic text-ink-soft">
          Got it — next friend.
        </p>
      </article>
    );
  }

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
            {cadenceStatus(state.friend)}
          </p>
        </div>
      </Link>

      <p className="mt-4 font-inter text-sm italic leading-relaxed text-ink">
        &ldquo;{question}&rdquo;
      </p>
      <p className="mt-3 font-inter text-xs italic leading-relaxed text-ink-soft">
        {whyItWorks(state)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={voiceNoteHref}
          className={cn(primaryButtonClassName, "flex-1 gap-2 py-2.5 text-xs")}
        >
          <Mic className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          Send voice note
        </Link>
        <button
          type="button"
          onClick={() => void skipPrompt()}
          className="flex-1 rounded-full border border-ink/[0.2] px-3 py-2.5 font-sans text-xs font-medium text-ink"
        >
          Not now
        </button>
      </div>
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
  const name = firstName(state.friend.name);
  const sentDaysAgo = daysSince(state.voice_note.created_at);
  const [dismissing, setDismissing] = useState(false);

  async function skipCapture() {
    setDismissing(true);
    await fetch(`/api/capture/${state.voice_note.id}/defer`, {
      method: "POST",
    });
    // Small delay to ensure database write completes before refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    onRefresh();
  }

  if (dismissing) {
    return (
      <article className="rounded-3xl bg-cream-deep/80 p-4">
        <p className="font-inter text-sm italic text-ink-soft">
          Got it &mdash; see you tomorrow.
        </p>
      </article>
    );
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
            voice note sent {sentDaysAgo === 1 ? "yesterday" : `${sentDaysAgo} days ago`}
          </p>
        </div>
      </div>

      {state.original_question && (
        <p className="mt-4 font-inter text-sm italic leading-relaxed text-ink-soft">
          You asked: &ldquo;{state.original_question}&rdquo;
        </p>
      )}
      <p className="mt-4 font-sans text-sm font-semibold leading-relaxed text-ink">
        Anything you want to remember about this?
      </p>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/capture/${state.voice_note.id}`}
          className={cn(primaryButtonClassName, "flex-1 py-2.5 text-xs")}
        >
          Capture →
        </Link>
        <button
          type="button"
          onClick={() => void skipCapture()}
          className="flex-1 rounded-full border border-ink/[0.2] px-3 py-2.5 font-sans text-xs font-medium text-ink"
        >
          Not yet
        </button>
      </div>
    </article>
  );
}
