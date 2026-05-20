"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Eyebrow, Headline, Subhead } from "@/components/brand";
import { ConstellationView } from "@/components/onboarding/ConstellationView";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { AppShell } from "@/components/layout/AppShell";
import { BrandBar } from "@/components/brand";
import { useOnboarding } from "@/contexts/onboarding-context";
import { splitReflectionRevealGroups } from "@/lib/onboarding/person-utils";

export function HeldScreen() {
  const router = useRouter();
  const {
    q1People,
    circleAssignments,
    watchers,
    toggleWatcher,
    setWatchers,
    hydrated,
  } = useOnboarding();
  const { innerCircle } = useMemo(
    () => splitReflectionRevealGroups(q1People, circleAssignments),
    [q1People, circleAssignments]
  );

  const selectedCount = watchers.filter((id) =>
    innerCircle.some((person) => person.id === id)
  ).length;
  const canContinue = selectedCount >= 1;

  useEffect(() => {
    if (hydrated && q1People.length === 0) {
      router.replace("/onboarding/q1");
    }
    if (hydrated && q1People.length > 0 && innerCircle.length === 0) {
      router.replace("/onboarding/q2");
    }
  }, [hydrated, innerCircle.length, q1People.length, router]);

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
          <div className="space-y-2">
            <Eyebrow>One last thing</Eyebrow>
            <Headline>Choose who holds you.</Headline>
            <Subhead>
              Pick one or two people from your inner circle. If you pass your
              quiet window, we&apos;ll gently let them know to check on you.
              You can adjust the number of days later.
            </Subhead>
          </div>

          <ConstellationView
            faces={innerCircle}
            selectable
            heartBadge
            selectedIds={watchers}
            onToggleSelect={toggleWatcher}
          />

          <p className="text-center font-inter text-sm italic text-ink-soft">
            {selectedCount} selected · pick 1 or 2
          </p>
        </div>

        <div className="mt-8 space-y-4 pb-4">
          <ContinueButton
            href={canContinue ? "/onboarding/email-prefs" : undefined}
            disabled={!canContinue}
            variant="terracotta"
          >
            Continue
          </ContinueButton>
          <p className="text-center">
            <button
              type="button"
              onClick={() => {
                setWatchers([]);
                router.push("/onboarding/email-prefs");
              }}
              className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2"
            >
              Set up Held later
            </button>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
