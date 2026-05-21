"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { CaptureSpotlight, SendSpotlight } from "@/components/today/DailySpotlight";
import { TribeCircleGraphic } from "@/components/today/TribeCircleGraphic";
import { TodayPageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type { TodayDailyState, TodayResponse } from "@/lib/api/types";
import { dayEyebrow } from "@/lib/today/format";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function greetingName(user: TodayResponse["user"] | undefined) {
  const name = user?.name?.trim();
  if (name) return firstName(name);
  const emailName = user?.email?.split("@")[0]?.trim();
  return emailName || null;
}

function dayLabel(state: TodayDailyState | null | undefined) {
  const base = dayEyebrow();
  if (!state || state.kind === "send_algorithmic" || !state.day_number) return base;
  return `${base} · day ${state.day_number}`;
}

function reachOutPeriod() {
  const hour = new Date().getHours();
  return hour >= 17 ? "Tonight" : "Today";
}

function headlineForState(state: TodayDailyState | null | undefined) {
  if (!state) return "Who you can build community with today.";
  const name = firstName(state.friend.name).toLowerCase();
  if (state.kind === "capture") return `What did ${name} share?`;
  return `${reachOutPeriod()}, reach out to ${name}.`;
}

function tomorrowHint(state: TodayDailyState | null | undefined) {
  if (!state) return null;
  const name = firstName(state.friend.name).toLowerCase();
  if (state.kind === "capture") {
    const nextDepth = Math.min((state.cycle_number ?? 1) + 1, 5);
    return `A new question for your tribe — depth ${nextDepth} of 5.`;
  }
  return `Capture what ${name} says — and their profile starts filling in.`;
}

export function TodayScreen() {
  const router = useRouter();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
      const result = await fetchJson<TodayResponse>("/api/today");
      if (result.status === 401) {
        router.replace("/signin?next=/today");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setData(result.data);
      setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const tribeCount = data?.tribe.length ?? 0;
  const state = data?.dailyState ?? null;
  const hint = tomorrowHint(state);
  const name = greetingName(data?.user);

  return (
    <AppShell>
      <BrandBar className="py-2" />
      <div className="flex h-[calc(100dvh-49px)] flex-col overflow-hidden px-5 pb-20 pt-3">
        {name && (
          <p className="mb-2 font-inter text-sm italic text-ink-soft">
            Hi, {name}.
          </p>
        )}
        <Eyebrow>{dayLabel(state)}</Eyebrow>
        <Headline className="mt-1 text-[23px] leading-tight">
          {headlineForState(state)}
        </Headline>

        {loading && <TodayPageSkeleton />}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <div className="mt-4 space-y-4">
            {state ? (
              state.kind === "capture" ? (
                <CaptureSpotlight
                  state={state}
                  onRefresh={() => {
                    setLoading(true);
                    void load();
                  }}
                />
              ) : (
                <SendSpotlight state={state} />
              )
            ) : (
              <div className="rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
                <Subhead>
                  Everyone in your tribe is on rhythm. Take a quiet day.
                </Subhead>
              </div>
            )}

            {hint && (
              <section>
                <Eyebrow className="mb-1">tomorrow</Eyebrow>
                <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
                  {hint}
                </p>
              </section>
            )}

            <section>
              <Eyebrow className="mb-1">
                your tribe · {tribeCount}{" "}
                {tribeCount === 1 ? "person" : "people"}
              </Eyebrow>
              <p className="mb-1.5 font-inter text-xs italic text-ink-soft">
                Tap a circle to open their profile.
              </p>
              <TribeCircleGraphic
                tribe={data.tribe}
                highlightFriendId={state?.friend.id}
              />
            </section>
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}
