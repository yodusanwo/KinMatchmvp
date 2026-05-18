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
  const { q1People, q2People, hydrated } = useOnboarding();

  const { innerCircle, growingCloser } = useMemo(
    () => splitReflectionRevealGroups(q1People, q2People),
    [q1People, q2People]
  );

  const subhead = formatRevealSubhead(q1People.length, q2People.length);

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
      <div className="flex min-h-[calc(100vh-65px)] flex-col px-5 py-6">
        <div className="flex-1 space-y-8">
          <div className="space-y-2 text-center">
            <Eyebrow>Reflection complete</Eyebrow>
            <Headline>Here&apos;s your tribe.</Headline>
            <Subhead className="text-center">{subhead}</Subhead>
          </div>

          {innerCircle.length > 0 && (
            <section className="space-y-5">
              <Eyebrow>Your inner circle · {innerCircle.length}</Eyebrow>
              <ConstellationView faces={innerCircle} avatarSize="lg" />
            </section>
          )}

          {growingCloser.length > 0 && (
            <section
              className={cn(
                "space-y-5",
                innerCircle.length > 0 && "border-t border-ink/[0.12] pt-8"
              )}
            >
              <Eyebrow>Growing closer · {growingCloser.length}</Eyebrow>
              <GrowingCloserRow faces={growingCloser} />
            </section>
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
