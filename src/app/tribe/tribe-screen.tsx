"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { TribeCircleGraphic } from "@/components/today/TribeCircleGraphic";
import { TodayPageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type { TodayResponse } from "@/lib/api/types";

export function TribeScreen() {
  const router = useRouter();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<TodayResponse>("/api/today");
      if (result.status === 401) {
        router.replace("/signin?next=/tribe");
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
    void load();
  }, [router]);

  const tribeCount = data?.tribe.length ?? 0;

  return (
    <AppShell>
      <BrandBar className="py-2" />
      <div className="flex h-[calc(100dvh-49px)] flex-col overflow-hidden px-5 pb-20 pt-4">
        <div className="space-y-1">
          <Eyebrow>Your tribe</Eyebrow>
          <Headline className="text-[28px] leading-tight">
            {tribeCount === 1 ? "1 person" : `${tribeCount} people`}
          </Headline>
          <Subhead className="text-sm leading-relaxed">
            Everyone you&apos;re tending this season.
          </Subhead>
        </div>

        {loading && <TodayPageSkeleton />}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <div className="mt-6 flex flex-1 flex-col justify-center">
            <TribeCircleGraphic
              tribe={data.tribe}
              className="h-[300px] max-w-[340px]"
            />
            <p className="mt-4 text-center font-inter text-xs italic text-ink-soft">
              Tap a circle to open their profile.
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}
