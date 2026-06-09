"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { GreetingSection } from "@/components/dashboard/GreetingSection";
import { CoreTribeSection } from "@/components/dashboard/CoreTribeSection";
import { MomentumSection } from "@/components/dashboard/MomentumSection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { fetchJson } from "@/lib/api/fetch-client";
import type { DashboardResponse } from "@/lib/api/types";

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

      <div className="px-5 pb-28 pt-8">
        <Eyebrow>dashboard</Eyebrow>

        {loading && <DashboardSkeleton />}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <div className="mt-5 space-y-6">
            <GreetingSection firstName={data.user.firstName} />

            <CoreTribeSection friends={data.coreTribe} />

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
        )}
      </div>

      <BottomNav />
    </AppShell>
  );
}
