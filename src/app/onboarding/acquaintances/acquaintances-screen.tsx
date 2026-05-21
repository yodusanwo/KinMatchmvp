"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { BrandBar, Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { NameChipList } from "@/components/onboarding/NameChipList";
import { useOnboarding } from "@/contexts/onboarding-context";
import { splitReflectionRevealGroups } from "@/lib/onboarding/person-utils";

export function AcquaintancesScreen() {
  const router = useRouter();
  const { q1People, circleAssignments, hydrated } = useOnboarding();

  const { acquaintances } = useMemo(
    () => splitReflectionRevealGroups(q1People, circleAssignments),
    [q1People, circleAssignments]
  );

  useEffect(() => {
    if (hydrated && q1People.length === 0) {
      router.replace("/onboarding/q1");
    }
  }, [hydrated, q1People.length, router]);

  if (!hydrated) {
    return (
      <AppShell>
        <BrandBar />
        <p className="px-5 py-10 text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-[calc(100vh-65px)] flex-col px-5 py-8">
        <div className="flex-1 space-y-6">
          <div className="space-y-2 text-center">
            <Eyebrow>Acquaintances</Eyebrow>
            <Headline>Set Aside For Later.</Headline>
            <Subhead className="text-center">
              These people stay outside your active tribe for now. You can bring
              them closer later.
            </Subhead>
          </div>

          {acquaintances.length > 0 ? (
            <NameChipList people={acquaintances} onRemove={() => undefined} />
          ) : (
            <p className="text-center font-inter text-sm italic text-ink-soft">
              No Acquaintances Yet.
            </p>
          )}
        </div>

        <p className="mt-8 pb-4 text-center">
          <TextLink href="/onboarding/reveal">← Back To Your Circles</TextLink>
        </p>
      </div>
    </AppShell>
  );
}
