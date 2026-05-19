"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { fetchJson } from "@/lib/api/fetch-client";
import type { FriendProfile } from "@/lib/api/types";
import {
  combineLocalDateTime,
  nextWeekdayEvenings,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/plans/date-utils";

type PlanScreenProps = {
  friendId: string;
};

type OptionDraft = {
  date: string;
  time: string;
};

type CreatePlanResponse = {
  poll_url: string;
  share_text: string;
};

export function PlanScreen({ friendId }: PlanScreenProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<Pick<
    FriendProfile,
    "id" | "name" | "avatar_color"
  > | null>(null);
  const [options, setOptions] = useState<OptionDraft[]>(() =>
    nextWeekdayEvenings(3).map((date) => ({
      date: toDateInputValue(date),
      time: toTimeInputValue(date),
    }))
  );
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "sending" | "sent" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollUrl, setPollUrl] = useState<string | null>(null);

  const loadFriend = useCallback(async () => {
    const result = await fetchJson<FriendProfile>(`/api/friends/${friendId}`);
    if (result.status === 401) {
      router.replace(`/signin?next=/friends/${friendId}/plan`);
      return;
    }
    if (!result.ok) {
      router.replace("/today");
      return;
    }
    setFriend({
      id: result.data.id,
      name: result.data.name,
      avatar_color: result.data.avatar_color,
    });
    setStatus("idle");
  }, [friendId, router]);

  useEffect(() => {
    void loadFriend();
  }, [loadFriend]);

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option
      )
    );
  }

  async function handleSend() {
    if (!friend) return;
    const datetimes = options.map((option) =>
      combineLocalDateTime(option.date, option.time)
    );
    if (datetimes.some((value) => !value)) {
      setErrorMessage("Choose a date and time for all three options.");
      return;
    }

    setStatus("sending");
    setErrorMessage(null);

    const result = await fetchJson<CreatePlanResponse>(
      `/api/friends/${friend.id}/plans`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim() || undefined,
          options: datetimes,
        }),
      }
    );

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }

    setPollUrl(result.data.poll_url);
    setStatus("sent");

    if (navigator.share) {
      try {
        await navigator.share({
          text: result.data.share_text,
          url: result.data.poll_url,
        });
      } catch {
        // User cancelled share sheet; keep fallback link visible.
      }
    } else {
      await navigator.clipboard?.writeText(result.data.share_text).catch(() => {});
    }
  }

  if (status === "loading" || !friend) {
    return (
      <AppShell>
        <BrandBar />
        <div className="px-5 py-12">
          <p className="font-inter text-sm italic text-ink-soft">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="flex items-center border-b border-ink/[0.12] px-5 py-3">
        <Link
          href={`/friends/${friend.id}`}
          className="font-inter text-sm text-terracotta underline underline-offset-2"
        >
          ← Back
        </Link>
      </div>

      <div className="px-5 pb-10 pt-6">
        <div className="flex items-center gap-3">
          <MiniAvatar
            name={friend.name}
            avatarColor={friend.avatar_color}
            size="md"
          />
          <div>
            <Eyebrow>Plan with</Eyebrow>
            <Headline className="text-lg">{friend.name}</Headline>
          </div>
        </div>

        <Headline as="h2" className="mt-8">
          Suggest 3 times
        </Headline>
        <Subhead className="mt-2">
          Pick a few easy options. We&apos;ll make a simple link they can tap.
        </Subhead>

        <div className="mt-6 space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className="rounded-2xl border border-ink/[0.12] bg-cream-deep/40 p-3"
            >
              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                Option {index + 1}
              </p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={option.date}
                  onChange={(event) =>
                    updateOption(index, { date: event.target.value })
                  }
                  className="min-w-0 flex-1 rounded-xl border border-ink/[0.2] bg-cream px-3 py-2 font-inter text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                />
                <input
                  type="time"
                  value={option.time}
                  onChange={(event) =>
                    updateOption(index, { time: event.target.value })
                  }
                  className="min-w-0 flex-1 rounded-xl border border-ink/[0.2] bg-cream px-3 py-2 font-inter text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                />
              </div>
            </div>
          ))}
        </div>

        <label className="mt-6 block">
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
            What did you have in mind?
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Coffee Saturday morning?"
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-ink/[0.2] bg-cream-deep/60 px-4 py-3 font-inter text-sm italic leading-relaxed text-ink placeholder:text-ink-soft/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
          />
        </label>

        {errorMessage && (
          <p className="mt-3 font-inter text-sm italic text-terracotta-deep">
            {errorMessage}
          </p>
        )}

        <PrimaryButton
          type="button"
          className="mt-6 w-full"
          disabled={status === "sending"}
          onClick={() => void handleSend()}
        >
          {status === "sending" ? "Creating plan…" : "Send plan"}
        </PrimaryButton>

        {pollUrl && (
          <p className="mt-4 text-center font-inter text-sm italic text-ink-soft">
            Plan link ready:{" "}
            <a
              href={pollUrl}
              className="text-terracotta underline underline-offset-2"
            >
              open poll
            </a>
          </p>
        )}
      </div>
    </AppShell>
  );
}
