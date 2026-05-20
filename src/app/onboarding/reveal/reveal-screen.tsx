"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { BrandBar, Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { ConstellationView } from "@/components/onboarding/ConstellationView";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { GrowingCloserRow } from "@/components/onboarding/GrowingCloserRow";
import { AppShell } from "@/components/layout/AppShell";
import { useOnboarding } from "@/contexts/onboarding-context";
import {
  formatRevealSubhead,
  splitReflectionRevealGroups,
} from "@/lib/onboarding/person-utils";
import { cn } from "@/lib/cn";

export function RevealScreen() {
  const router = useRouter();
  const { q1People, circleAssignments, hydrated } = useOnboarding();

  const { innerCircle, village, acquaintances } = useMemo(
    () => splitReflectionRevealGroups(q1People, circleAssignments),
    [q1People, circleAssignments]
  );

  const subhead = formatRevealSubhead(innerCircle.length, village.length);

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
      <div className="flex min-h-[calc(100vh-65px)] flex-col px-5 py-6">
        <div className="flex-1 space-y-8">
          <div className="space-y-2 text-center">
            <Eyebrow>Reflection complete</Eyebrow>
            <Headline>Here are your circles.</Headline>
            <Subhead className="text-center">{subhead}</Subhead>
          </div>

          {innerCircle.length > 0 && (
            <section className="space-y-5">
              <Eyebrow>Your inner circle · {innerCircle.length}</Eyebrow>
              <ConstellationView faces={innerCircle} avatarSize="lg" />
            </section>
          )}

          {village.length > 0 && (
            <section
              className={cn(
                "space-y-5",
                innerCircle.length > 0 && "border-t border-ink/[0.12] pt-8"
              )}
            >
              <Eyebrow>Your village · {village.length}</Eyebrow>
              <GrowingCloserRow faces={village} />
            </section>
          )}

          {acquaintances.length > 0 && (
            <p className="border-t border-ink/[0.12] pt-6 text-center font-inter text-sm italic text-ink-soft">
              {acquaintances.length === 1
                ? "1 acquaintance is set aside for the acquaintances page."
                : `${acquaintances.length} acquaintances are set aside for the acquaintances page.`}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4 pb-4">
          <ContinueButton variant="terracotta" href="/onboarding/held">
            Continue →
          </ContinueButton>
          <p className="text-center">
            <TextLink href="/onboarding/q3">← Back to step 3</TextLink>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
