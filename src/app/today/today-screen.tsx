"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { SpotlightCard } from "@/components/today/SpotlightCard";
import { TribeList } from "@/components/today/TribeList";
import type { TodayResponse } from "@/lib/api/types";
import { dayEyebrow } from "@/lib/today/format";

export function TodayScreen() {
  const router = useRouter();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/today");
      if (res.status === 401) {
        router.replace("/signin?next=/today");
        return;
      }
      if (!res.ok) {
        setError("Couldn't load your tribe. Try again in a moment.");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as TodayResponse;
      setData(json);
      setLoading(false);
    }
    load();
  }, [router]);

  const tribeCount = data?.tribe.length ?? 0;

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-screen flex-col px-5 pb-28 pt-6">
        <Eyebrow>{dayEyebrow()}</Eyebrow>
        <Headline className="mt-2">Who needs you today?</Headline>

        {loading && (
          <p className="mt-8 font-inter text-sm italic text-ink-soft">
            Loading your tribe…
          </p>
        )}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <div className="mt-8 space-y-8">
            {data.spotlight ? (
              <SpotlightCard spotlight={data.spotlight} />
            ) : (
              <div className="rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
                <Subhead>
                  Everyone in your tribe is on rhythm. Take a quiet day.
                </Subhead>
              </div>
            )}

            <section>
              <Eyebrow className="mb-1">
                your tribe · {tribeCount}{" "}
                {tribeCount === 1 ? "person" : "people"}
              </Eyebrow>
              <p className="mb-4 font-inter text-sm italic text-ink-soft">
                Tap a name to open their profile.
              </p>
              <TribeList tribe={data.tribe} />
            </section>
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}
