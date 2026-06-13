"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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

function countdown(date: string | null): { value: string; unit: string | null } {
  const days = daysUntil(date);
  if (days === null) return { value: "Ongoing", unit: null };
  if (days <= 0) return { value: "Today", unit: null };
  if (days === 1) return { value: "Tomorrow", unit: null };
  return { value: String(days), unit: "days away" };
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

  const { hero, rest } = useMemo(() => {
    const sorted = [...rituals].sort((a, b) => {
      if (!a.next_date && !b.next_date) return a.name.localeCompare(b.name);
      if (!a.next_date) return 1;
      if (!b.next_date) return -1;
      return a.next_date.localeCompare(b.next_date);
    });
    // The soonest dated ritual anchors the screen; everything else lists below.
    const heroRitual = sorted.find((ritual) => ritual.next_date) ?? sorted[0] ?? null;
    return {
      hero: heroRitual,
      rest: sorted.filter((ritual) => ritual.id !== heroRitual?.id),
    };
  }, [rituals]);

  return (
    <AppShell>
      <BrandBar />
      <div className="px-5 pb-28 pt-6">
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
          <div className="mt-5 space-y-4">
            <p className="font-sans text-sm italic leading-relaxed text-slate">
              No rituals yet. Standing dates with your people are the easiest
              way to keep a friendship in rhythm.
            </p>
            <div className="rounded-lg border border-hairline bg-cream-deep p-4">
              <p className="font-sans text-sm font-semibold text-ink">
                Want a suggestion? Try one of these:
              </p>
              <ul className="mt-3 space-y-2 font-sans text-sm italic text-slate">
                <li>Weekly call with a parent</li>
                <li>Coffee every other Saturday</li>
                <li>Monthly dinner with a group</li>
                <li>Quarterly trip with friends</li>
              </ul>
            </div>
            <Link
              href="/rituals/new"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm bg-carbon px-6 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-ink"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Create your own
            </Link>
          </div>
        )}

        {!loading && !error && hero && (
          <div className="mt-5 space-y-5">
            <RitualHero ritual={hero} />

            {rest.length > 0 && (
              <section className="space-y-2.5">
                <Eyebrow>also coming up</Eyebrow>
                <div className="space-y-2">
                  {rest.map((ritual) => (
                    <RitualCard key={ritual.id} ritual={ritual} />
                  ))}
                </div>
              </section>
            )}

            <Link
              href="/rituals/new"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-hairline-strong bg-cream-deep/40 px-4 py-4 font-sans text-sm font-semibold text-slate transition-colors hover:bg-cream-deep"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Add a ritual
            </Link>
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}

function RitualHero({ ritual }: { ritual: RitualSummary }) {
  const { value, unit } = countdown(ritual.next_date);

  return (
    <Link
      href={`/rituals/${ritual.id}`}
      className="relative block overflow-hidden rounded-xl rounded-tl-none bg-hero p-5"
    >
      <span
        className="pointer-events-none absolute left-0 top-0 h-[11px] w-[11px] bg-terracotta"
        aria-hidden
      />
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-hero-meta">
        next up
      </p>
      <p className="mt-2 font-sans text-lg font-bold leading-snug text-carbon">
        {ritual.name}
      </p>
      <p className="mt-0.5 font-sans text-sm italic text-hero-meta">
        {participantLine(ritual)}
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-[40px] leading-none text-carbon">
          {value}
        </span>
        {unit && (
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.06em] text-hero-meta">
            {unit}
          </span>
        )}
      </div>
    </Link>
  );
}

function RitualCard({ ritual }: { ritual: RitualSummary }) {
  return (
    <Link
      href={`/rituals/${ritual.id}`}
      className="block rounded-lg border border-hairline bg-cream-deep px-4 py-3.5 transition-colors hover:bg-cream-deep/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-base font-semibold text-ink">
            {ritual.name}
          </p>
          <p className="mt-0.5 font-sans text-sm italic leading-relaxed text-slate">
            {participantLine(ritual)}
          </p>
        </div>
        <p className="shrink-0 font-sans text-sm font-bold text-ink">
          {relativeDate(ritual.next_date)}
        </p>
      </div>
    </Link>
  );
}
