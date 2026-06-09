"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { TodayPageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import { frequencyLabel, type RitualSummary } from "@/lib/rituals/types";

type RitualsResponse = {
  rituals: RitualSummary[];
};

function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date();
  const target = new Date(`${date}T12:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeDate(date: string | null) {
  const days = daysUntil(date);
  if (days === null) return "ongoing";
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `${days} days`;
}

function participantLine(ritual: RitualSummary) {
  const names = ritual.participants.map((friend) => friend.name.split(/\s+/)[0]);
  const people =
    names.length === 0
      ? "solo"
      : names.length === 1
        ? `with ${names[0]}`
        : names.join(", ");
  return `${frequencyLabel(ritual.frequency, ritual.recurrence_pattern)} · ${people}`;
}

export function RitualsScreen() {
  const [rituals, setRituals] = useState<RitualSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<RitualsResponse>("/api/rituals");
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setRituals(result.data.rituals);
      setLoading(false);
    }
    void load();
  }, []);

  const grouped = useMemo(() => {
    const sorted = [...rituals].sort((a, b) => {
      if (!a.next_date && !b.next_date) return a.name.localeCompare(b.name);
      if (!a.next_date) return 1;
      if (!b.next_date) return -1;
      return a.next_date.localeCompare(b.next_date);
    });
    return {
      thisWeek: sorted.filter((ritual) => {
        const days = daysUntil(ritual.next_date);
        return days !== null && days <= 7;
      }),
      thisMonth: sorted.filter((ritual) => {
        const days = daysUntil(ritual.next_date);
        return days !== null && days > 7 && days <= 30;
      }),
      ongoing: sorted.filter((ritual) => {
        const days = daysUntil(ritual.next_date);
        return days === null || days > 30;
      }),
    };
  }, [rituals]);

  return (
    <AppShell>
      <BrandBar />
      <div className="px-5 pb-28 pt-8">
        <Eyebrow>rituals · standing dates</Eyebrow>
        <Headline className="mt-2">The dates that hold.</Headline>
        <Subhead className="mt-2 text-sm">
          Standing time with the people you want to keep close.
        </Subhead>

        {loading && <TodayPageSkeleton />}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && rituals.length === 0 && (
          <div className="mt-8 space-y-5">
            <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
              No rituals yet. Standing dates with your people are the easiest
              way to keep a friendship in rhythm.
            </p>
            <div className="rounded-2xl border border-ink-soft/30 bg-cream-deep/50 p-4">
              <p className="font-sans text-sm font-medium text-ink">
                Want a suggestion? Try one of these:
              </p>
              <ul className="mt-3 space-y-2 font-inter text-xs italic text-ink-soft">
                <li>Weekly call with a parent</li>
                <li>Coffee every other Saturday</li>
                <li>Monthly dinner with a group</li>
                <li>Quarterly trip with friends</li>
              </ul>
            </div>
            <Link
              href="/rituals/new"
              className="block text-center font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2"
            >
              + Create your own
            </Link>
          </div>
        )}

        {!loading && !error && rituals.length > 0 && (
          <div className="mt-8 space-y-8">
            <RitualSection title="this week" rituals={grouped.thisWeek} urgent />
            <RitualSection title="this month" rituals={grouped.thisMonth} />
            <RitualSection title="ongoing" rituals={grouped.ongoing} />
            <Link
              href="/rituals/new"
              className="flex w-full items-center justify-center rounded-2xl border border-dashed border-ink-soft/40 px-4 py-4 font-sans text-xs font-medium text-ink-soft"
            >
              + Add a ritual
            </Link>
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}

function RitualSection({
  title,
  rituals,
  urgent = false,
}: {
  title: string;
  rituals: RitualSummary[];
  urgent?: boolean;
}) {
  if (rituals.length === 0) return null;

  return (
    <section>
      <Eyebrow className="mb-3">{title}</Eyebrow>
      <div className="space-y-3">
        {rituals.map((ritual) => (
          <Link
            key={ritual.id}
            href={`/rituals/${ritual.id}`}
            className={`block rounded-2xl border p-4 ${
              urgent
                ? "border-terracotta/40 bg-terracotta/20"
                : "border-ink-soft/25 bg-cream-deep/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-sans text-[15px] font-medium text-ink">
                {ritual.name}
              </p>
              <p className={`shrink-0 font-sans text-[12px] font-medium ${
                urgent ? "text-terracotta" : "text-ink-soft"
              }`}>
                {relativeDate(ritual.next_date)}
              </p>
            </div>
            <p className="mt-2 font-inter text-[15px] italic leading-relaxed text-ink-soft/80">
              {participantLine(ritual)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
