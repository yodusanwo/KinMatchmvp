"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { TribeList } from "@/components/today/TribeList";
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
      <BrandBar />
      <div className="flex min-h-screen flex-col px-5 pb-28 pt-6">
        <Eyebrow>Your tribe</Eyebrow>
        <Headline className="mt-2">
          {tribeCount === 1 ? "1 person" : `${tribeCount} people`}
        </Headline>
        <Subhead className="mt-2">
          Everyone you&apos;re tending this season. Tap a name for their profile.
        </Subhead>

        {loading && <TodayPageSkeleton />}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <div className="mt-8">
            <TribeList tribe={data.tribe} />
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}
