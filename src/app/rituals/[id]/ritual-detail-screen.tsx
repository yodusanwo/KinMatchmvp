"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandBar, Eyebrow, Headline, PrimaryButton, SecondaryButton } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { frequencyLabel, type RitualFrequency } from "@/lib/rituals/types";

type DetailRitual = {
  id: string;
  name: string;
  description: string | null;
  frequency: RitualFrequency;
  recurrence_pattern: string | null;
  next_date: string | null;
  ritual_participants?: {
    friends: { id: string; name: string } | { id: string; name: string }[] | null;
  }[];
  ritual_occurrences?: {
    id: string;
    scheduled_date: string;
    status: "upcoming" | "completed" | "missed";
    completed_at: string | null;
    notes: string | null;
  }[];
};

function formatDate(value: string | null) {
  if (!value) return "not scheduled yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function RitualDetailScreen({ ritual }: { ritual: DetailRitual }) {
  const router = useRouter();
  const [saving, setSaving] = useState<"completed" | "missed" | "archive" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const participants = useMemo(
    () =>
      (ritual.ritual_participants ?? [])
        .flatMap((participant) => {
          if (!participant.friends) return [];
          return Array.isArray(participant.friends)
            ? participant.friends.map((friend) => friend.name)
            : [participant.friends.name];
        })
        .filter((name): name is string => Boolean(name)),
    [ritual.ritual_participants]
  );
  const participantText =
    participants.length === 0 ? "solo" : `with ${participants.join(", ")}`;
  const history = (ritual.ritual_occurrences ?? [])
    .filter((occurrence) => occurrence.status !== "upcoming")
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 10);

  async function mark(status: "completed" | "missed") {
    setSaving(status);
    setError(null);
    const response = await fetch(`/api/rituals/${ritual.id}/occurrences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not update this ritual.");
      setSaving(null);
      return;
    }
    router.refresh();
    setSaving(null);
  }

  async function archive() {
    setSaving("archive");
    setError(null);
    const response = await fetch(`/api/rituals/${ritual.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not archive this ritual.");
      setSaving(null);
      return;
    }
    router.replace("/rituals");
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="px-5 pb-28 pt-6">
        <Link
          href="/rituals"
          className="font-inter text-sm text-terracotta underline underline-offset-2"
        >
          ← Rituals
        </Link>

        <div className="mt-8 space-y-3">
          <Headline>{ritual.name}</Headline>
          <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
            {frequencyLabel(ritual.frequency, ritual.recurrence_pattern)} ·{" "}
            {participantText}
          </p>
          <span className="inline-flex rounded-full bg-terracotta/10 px-3 py-1 font-sans text-[11px] font-medium text-terracotta">
            Next: {formatDate(ritual.next_date)}
          </span>
        </div>

        <div className="mt-8 space-y-3">
          <PrimaryButton
            disabled={Boolean(saving)}
            onClick={() => void mark("completed")}
          >
            {saving === "completed" ? "Saving…" : "Mark as happened"}
          </PrimaryButton>
          <SecondaryButton
            disabled={Boolean(saving)}
            onClick={() => void mark("missed")}
          >
            Couldn&apos;t do it this time
          </SecondaryButton>
          <SecondaryButton disabled>
            Edit ritual
          </SecondaryButton>
          <button
            type="button"
            disabled={Boolean(saving)}
            onClick={() => void archive()}
            className="w-full rounded-full border border-terracotta/30 px-6 py-3.5 font-sans text-sm font-medium text-terracotta-deep disabled:opacity-50"
          >
            {saving === "archive" ? "Archiving…" : "Archive ritual"}
          </button>
          {error && (
            <p className="font-inter text-sm italic text-terracotta-deep" role="alert">
              {error}
            </p>
          )}
        </div>

        <section className="mt-10">
          <Eyebrow>history</Eyebrow>
          {history.length === 0 ? (
            <p className="mt-3 font-inter text-sm italic text-ink-soft">
              No past dates yet.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((occurrence) => (
                <div
                  key={occurrence.id}
                  className="flex items-center justify-between rounded-2xl border border-ink/[0.08] bg-cream-deep px-4 py-3"
                >
                  <p className="font-sans text-sm text-ink">
                    {formatDate(occurrence.scheduled_date)}
                  </p>
                  <p className="font-inter text-xs italic text-ink-soft">
                    {occurrence.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 font-inter text-[11px] italic leading-relaxed text-ink-soft">
          TODO v1.1: bring ritual reminders into Today, add post-ritual capture,
          account for upcoming rituals in Spotlight, export calendars, celebrate
          streaks, and add notification support.
        </p>
      </div>
      <BottomNav />
    </AppShell>
  );
}
