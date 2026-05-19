"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandBar, Headline, PrimaryLink, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { fetchJson } from "@/lib/api/fetch-client";
import { formatPlanOption } from "@/lib/plans/date-utils";
import type { PublicPlanPoll } from "@/lib/plans/types";

type PlanPollScreenProps = {
  pollToken: string;
};

export function PlanPollScreen({ pollToken }: PlanPollScreenProps) {
  const [poll, setPoll] = useState<PublicPlanPoll | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<PublicPlanPoll>(`/api/p/${pollToken}`);
      if (!result.ok) {
        setError(
          result.status === 404 ? "This plan link is unavailable." : result.error
        );
        setLoading(false);
        return;
      }
      setPoll(result.data);
      setLoading(false);
    }
    void load();
  }, [pollToken]);

  async function selectOption(option: 1 | 2 | 3) {
    setStatus("saving");
    setError(null);
    const result = await fetchJson<PublicPlanPoll>(`/api/p/${pollToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_option: option }),
    });
    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setPoll(result.data);
    setStatus("idle");
  }

  async function declineOptions() {
    setStatus("saving");
    setError(null);
    const result = await fetchJson<PublicPlanPoll>(`/api/p/${pollToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decline_reason: "None of these work",
      }),
    });
    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setPoll(result.data);
    setDeclined(true);
    setStatus("idle");
  }

  if (loading) {
    return (
      <AppShell>
        <BrandBar className="py-3" />
        <div className="px-5 py-16">
          <p className="font-inter text-sm italic text-ink-soft">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (error && !poll) {
    return (
      <AppShell>
        <BrandBar className="py-3" />
        <div className="px-5 py-16 text-center">
          <Headline>Plan not found</Headline>
          <Subhead className="mt-3">{error}</Subhead>
          <p className="mt-8">
            <Link
              href="/"
              className="font-inter text-sm text-terracotta underline underline-offset-2"
            >
              Go to KinMatch
            </Link>
          </p>
        </div>
      </AppShell>
    );
  }

  if (!poll) return null;

  if (poll.selected_option || declined) {
    const selected = poll.selected_option
      ? poll.options.find((option) => option.index === poll.selected_option)
      : null;

    return (
      <AppShell>
        <BrandBar className="py-3" />
        <div className="flex min-h-[calc(100vh-65px)] flex-col px-5 pb-10 pt-16 text-center">
          <Headline>Great, {poll.sender_name} will be in touch.</Headline>
          <Subhead className="mt-3">
            {selected
              ? `You picked ${formatPlanOption(selected.datetime)}.`
              : "You let them know these times do not work."}
          </Subhead>
          {selected && (
            <PrimaryLink
              href={`/api/p/${poll.poll_token}/ics`}
              className="mt-8"
            >
              Download calendar invite
            </PrimaryLink>
          )}
          <footer className="mt-auto pt-12 font-inter text-sm leading-relaxed text-ink-soft">
            This was planned through KinMatch.
          </footer>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BrandBar className="py-3" />
      <div className="flex min-h-[calc(100vh-65px)] flex-col px-5 pb-10 pt-10">
        <Headline>{poll.sender_name} wants to plan something.</Headline>
        <Subhead className="mt-3">
          Pick the time that works best for you.
        </Subhead>

        {poll.message && (
          <article className="mt-6 rounded-2xl border border-ink/[0.12] bg-cream-deep/50 p-4">
            <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
              “{poll.message}”
            </p>
          </article>
        )}

        <div className="mt-6 space-y-3">
          {poll.options.map((option) => (
            <button
              key={option.index}
              type="button"
              disabled={status === "saving"}
              onClick={() => void selectOption(option.index)}
              className="w-full rounded-2xl border border-ink/[0.16] bg-cream-deep/40 px-4 py-5 text-left transition-colors hover:border-terracotta/40 hover:bg-cream-deep disabled:opacity-60"
            >
              <span className="block font-sans text-base font-medium text-ink">
                {formatPlanOption(option.datetime)}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 font-inter text-sm italic text-terracotta-deep">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={status === "saving"}
          onClick={() => void declineOptions()}
          className="mt-6 font-inter text-sm italic text-terracotta underline underline-offset-2 disabled:opacity-60"
        >
          None of these work — let&apos;s find another time
        </button>
      </div>
    </AppShell>
  );
}
