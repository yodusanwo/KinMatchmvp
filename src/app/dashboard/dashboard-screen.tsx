"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { TribeCircleGraphic } from "@/components/today/TribeCircleGraphic";
import { MomentumSection } from "@/components/dashboard/MomentumSection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { fetchJson } from "@/lib/api/fetch-client";
import { cn } from "@/lib/cn";
import type { DashboardResponse, FriendSummary } from "@/lib/api/types";
import { formatDisplayName } from "@/lib/names/format";

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-2xl bg-cream-deep/40" />
      <div className="h-16 rounded-xl bg-cream-deep/40" />
      <div className="h-40 rounded-2xl bg-cream-deep/40" />
      <div className="h-32 rounded-2xl bg-cream-deep/40" />
    </div>
  );
}

export function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchJson<DashboardResponse>("/api/dashboard");
    if (result.status === 401) {
      router.replace("/signin?next=/dashboard");
      return;
    }
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell>
      <BrandBar />

      <div className="px-5 pb-28 pt-6">
        <Eyebrow>dashboard</Eyebrow>

        {loading && <div className="mt-5"><DashboardSkeleton /></div>}

        {error && (
          <p className="mt-8 font-sans text-sm italic text-burnt-orange" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <>
            <Headline className="mt-1 text-[22px]">
              {getTimeBasedGreeting()}, {data.user.firstName}.
            </Headline>
            <Subhead className="mt-1.5 text-sm">
              Here&apos;s where things stand with your people.
            </Subhead>

            <div className="mt-5 space-y-6">
              <DashboardHero data={data} />

              <section className="space-y-2.5">
                <Eyebrow>your core tribe</Eyebrow>
                {data.coreTribe.length > 0 ? (
                  <TribeCircleGraphic tribe={data.coreTribe} />
                ) : (
                  <div className="rounded-lg border border-hairline bg-cream-deep px-4 py-5">
                    <p className="font-sans text-sm italic text-slate">
                      Your closest people will appear here as you build your tribe.
                    </p>
                  </div>
                )}
              </section>

              <MomentumSection
                growing={data.momentum.growing}
                stable={data.momentum.stable}
                needsAttention={data.momentum.needsAttention}
              />

              <InsightsSection
                weeklyReachOuts={data.insights.weeklyReachOuts}
                weeklyVoiceNotes={data.insights.weeklyVoiceNotes}
              />
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </AppShell>
  );
}

function DashboardHero({ data }: { data: DashboardResponse }) {
  const quiet: FriendSummary | undefined = data.momentum.needsAttention[0];
  // When everyone's on rhythm, suggest keeping it going with the most-tended
  // people first (stable → core → growing).
  const suggested: FriendSummary | undefined =
    data.momentum.stable[0] ??
    data.coreTribe[0] ??
    data.momentum.growing[0];

  const target = quiet ?? suggested;
  if (!target) return null;

  const name = formatDisplayName(target.name);

  return (
    <article className="relative overflow-hidden rounded-xl rounded-tl-none bg-hero p-5">
      <span
        className="pointer-events-none absolute left-0 top-0 h-[11px] w-[11px] bg-terracotta"
        aria-hidden
      />
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-hero-meta">
        {quiet ? "needs you" : "keep the rhythm"}
      </p>
      {quiet ? (
        <>
          <p className="mt-2 font-sans text-lg font-bold leading-snug text-carbon">
            Reach out to {name}.
          </p>
          <p className="mt-1 font-sans text-sm italic text-hero-meta">
            {quiet.days_quiet} {quiet.days_quiet === 1 ? "day" : "days"} quiet — a
            quick voice note brings it back.
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 font-sans text-lg font-bold leading-snug text-carbon">
            Everyone&apos;s on rhythm.
          </p>
          <p className="mt-1 font-sans text-sm italic text-hero-meta">
            Send {name} a voice note to keep it going.
          </p>
        </>
      )}
      <Link
        href={`/friends/${target.id}/voice-note`}
        className={cn(primaryButtonClassName, "mt-4 gap-2")}
      >
        <Mic className="h-4 w-4" strokeWidth={2} aria-hidden />
        Send a voice note
      </Link>
    </article>
  );
}
