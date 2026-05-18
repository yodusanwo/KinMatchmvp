"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { HeldByRow } from "@/components/held/HeldByRow";
import { HeldEventCard } from "@/components/held/HeldEventCard";
import { HeldFriendRow } from "@/components/held/HeldFriendRow";
import { HeldPageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type { HeldResponse } from "@/lib/api/held";

export function HeldScreen() {
  const router = useRouter();
  const [data, setData] = useState<HeldResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<HeldResponse>("/api/held");
      if (result.status === 401) {
        router.replace("/signin?next=/held");
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

  const holdingCount = data?.holding.length ?? 0;
  const heldByCount = data?.held_by.length ?? 0;

  return (
    <AppShell>
      <BrandBar />

      <div className="px-5 pb-28 pt-6">
        <Headline>Held</Headline>
        <Subhead className="mt-2">
          A quiet circle of care. You hold {holdingCount} · {heldByCount} hold
          you.
        </Subhead>

        {loading && <HeldPageSkeleton />}

        {error && (
          <p className="mt-10 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {data && !loading && (
          <div className="mt-10 space-y-10">
            <section>
              <Eyebrow className="mb-3">You&apos;re holding</Eyebrow>
              {data.holding.length === 0 ? (
                <p className="font-inter text-sm italic text-ink-soft">
                  You haven&apos;t set up Held yet.{" "}
                  <Link
                    href="/onboarding/held"
                    className="text-terracotta underline underline-offset-2"
                  >
                    Configure who holds you →
                  </Link>
                </p>
              ) : (
                <ul className="divide-y divide-ink/[0.12]">
                  {data.holding.map((entry) => (
                    <HeldFriendRow key={entry.relationship_id} entry={entry} />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <Eyebrow className="mb-3">Held by</Eyebrow>
              {data.held_by.length === 0 ? (
                <p className="font-inter text-sm italic text-ink-soft">
                  When friends join KinMatch and hold you back, they&apos;ll
                  appear here. Your circle from setup is listed above.
                </p>
              ) : (
                <ul className="divide-y divide-ink/[0.12]">
                  {data.held_by.map((entry) => (
                    <HeldByRow key={entry.relationship_id} entry={entry} />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <Eyebrow className="mb-3">Recent</Eyebrow>
              {data.recent_events.length === 0 ? (
                <p className="font-inter text-sm italic text-ink-soft">
                  Held alerts aren&apos;t automated in the pilot yet — quiet
                  moments will show up here later.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recent_events.map((event) => (
                    <HeldEventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            <p className="text-center">
              <button
                type="button"
                disabled
                className="font-inter text-sm text-ink-soft underline decoration-ink-soft/40 underline-offset-2"
              >
                Pause or adjust thresholds — coming soon
              </button>
            </p>
          </div>
        )}
      </div>

      <BottomNav heldBadge={holdingCount > 0} />
    </AppShell>
  );
}
