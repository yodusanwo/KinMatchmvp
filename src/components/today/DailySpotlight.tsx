"use client";

import Link from "next/link";
import { useState } from "react";
import { Mic } from "lucide-react";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";
import type { TodayDailyState } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDisplayName } from "@/lib/names/format";

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
  const name = formatDisplayName(state.friend.name);
  const question = sendQuestion(state);
  const [skipping, setSkipping] = useState(false);
  const voiceNoteHref =
    state.kind === "send_discovery"
      ? `/api/discovery/outreach?friend_id=${state.friend.id}&day=${state.day_number}`
      : `/friends/${state.friend.id}/voice-note`;

  async function skipPrompt() {
    if (skipping) return; // Prevent double-clicks
    setSkipping(true);
    
    try {
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
    } catch (error) {
      console.error("Failed to skip prompt:", error);
      setSkipping(false); // Reset on error
    }
  }

  if (skipping) {
    return (
      <article className="relative rounded-sm border border-hairline bg-cream-deep p-4">
        <p className="font-sans text-sm italic text-ink-soft">
          Got it, next friend.
        </p>
      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-xl bg-hero p-5">
      <span
        className="pointer-events-none absolute left-0 top-0 h-[11px] w-[11px] bg-terracotta"
        aria-hidden
      />
      <Link
        href={`/friends/${state.friend.id}`}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <MiniAvatar
          name={state.friend.name}
          colorHex={state.friend.avatar_color_hex}
          initials={state.friend.avatar_initials}
          size="md"
        />
        <div>
          <p className="font-sans text-base font-bold text-carbon">{name}</p>
          <p className="font-sans text-xs text-hero-meta">
            {cadenceStatus(state.friend)}
          </p>
        </div>
      </Link>

      <p className="mt-4 font-sans text-[15px] font-semibold italic leading-relaxed text-carbon">
        &ldquo;{question}&rdquo;
      </p>
      <p className="mt-2.5 font-sans text-xs italic leading-relaxed text-hero-meta">
        {whyItWorks(state)}
      </p>

      <div className="mt-5 flex items-center gap-2.5">
        <Link
          href={voiceNoteHref}
          className={cn(primaryButtonClassName, "flex-1 gap-2")}
        >
          <Mic className="h-4 w-4" strokeWidth={2} aria-hidden />
          Send
        </Link>
        <button
          type="button"
          onClick={() => void skipPrompt()}
          disabled={skipping}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-sm border-[1.5px] border-carbon bg-transparent px-4 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-carbon transition-colors hover:bg-carbon/[0.06] active:translate-y-px disabled:opacity-50"
        >
          Not now
        </button>
      </div>
      <p className="mt-3 text-center">
        <Link
          href={`/friends/${state.friend.id}`}
          className="font-sans text-xs font-semibold text-burnt-orange underline decoration-burnt-orange/50 underline-offset-2"
        >
          view {name}&apos;s profile
        </Link>
      </p>
    </article>
  );
}

export function CaptureSpotlight({ state, onRefresh }: CaptureSpotlightProps) {
  const name = formatDisplayName(state.friend.name);
  const sentDaysAgo = daysSince(state.voice_note.created_at);
  const [dismissing, setDismissing] = useState(false);

  async function skipCapture() {
    if (dismissing) return; // Prevent double-clicks
    setDismissing(true);
    
    try {
      await fetch(`/api/capture/${state.voice_note.id}/defer`, {
        method: "POST",
      });
      // Small delay to ensure database write completes before refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      onRefresh();
    } catch (error) {
      console.error("Failed to skip capture:", error);
      setDismissing(false); // Reset on error
    }
  }

  if (dismissing) {
    return (
      <article className="relative rounded-sm border border-hairline bg-cream-deep p-4">
        <p className="font-sans text-sm italic text-ink-soft">
          Got it &mdash; see you tomorrow.
        </p>
      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-xl bg-hero p-5">
      <span
        className="pointer-events-none absolute left-0 top-0 h-[11px] w-[11px] bg-terracotta"
        aria-hidden
      />
      <div className="flex items-center gap-3">
        <MiniAvatar
          name={state.friend.name}
          colorHex={state.friend.avatar_color_hex}
          initials={state.friend.avatar_initials}
          size="md"
        />
        <div>
          <p className="font-sans text-base font-bold text-carbon">{name}</p>
          <p className="font-sans text-xs text-hero-meta">
            Voice note · {sentDaysAgo === 1 ? "yesterday" : `${sentDaysAgo} days ago`}
          </p>
        </div>
      </div>

      {state.original_question && (
        <p className="mt-4 font-sans text-sm italic leading-relaxed text-hero-meta">
          You asked: &ldquo;{state.original_question}&rdquo;
        </p>
      )}
      <p className="mt-4 font-sans text-[15px] font-semibold leading-relaxed text-carbon">
        Anything you want to remember about this?
      </p>

      <div className="mt-5 flex items-center gap-2.5">
        <Link
          href={`/capture/${state.voice_note.id}`}
          className={cn(primaryButtonClassName, "flex-1")}
        >
          Capture →
        </Link>
        <button
          type="button"
          onClick={() => void skipCapture()}
          disabled={dismissing}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-sm border-[1.5px] border-carbon bg-transparent px-4 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-carbon transition-colors hover:bg-carbon/[0.06] active:translate-y-px disabled:opacity-50"
        >
          Not yet
        </button>
      </div>
    </article>
  );
}
