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
          Your quiet circle of care. {holdingCount}{" "}
          {holdingCount === 1 ? "person holds" : "people hold"} you.
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
              <Eyebrow className="mb-3">Your holders</Eyebrow>
              {data.holding.length === 0 ? (
                <p className="font-inter text-sm italic text-ink-soft">
                  You haven&apos;t picked who holds you yet.{" "}
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

            {heldByCount > 0 && (
              <section>
              <Eyebrow className="mb-3">Held by</Eyebrow>
              <ul className="divide-y divide-ink/[0.12]">
                {data.held_by.map((entry) => (
                  <HeldByRow key={entry.relationship_id} entry={entry} />
                ))}
              </ul>
              </section>
            )}

            <section>
              <Eyebrow className="mb-3">Recent</Eyebrow>
              {data.recent_events.length === 0 ? (
                <p className="font-inter text-sm italic text-ink-soft">
                  Quiet-window notifications and acknowledgements will show up
                  here.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recent_events.map((event) => (
                    <HeldEventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </div>

      <BottomNav heldBadge={holdingCount > 0} />
    </AppShell>
  );
}
