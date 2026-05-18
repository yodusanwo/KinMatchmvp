"use client";

import { Eyebrow, Headline, TextLink } from "@/components/brand";
import { BarrierPillGroup } from "@/components/onboarding/BarrierPillGroup";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { ReflectionStepShell } from "@/components/onboarding/ReflectionStepShell";
import { useOnboarding } from "@/contexts/onboarding-context";

export function Q3Screen() {
  const { q3Barriers, toggleBarrier, hydrated } = useOnboarding();

  const canContinue = q3Barriers.length > 0;

  if (!hydrated) {
    return (
      <ReflectionStepShell step={3}>
        <p className="text-ink-soft">Loading…</p>
      </ReflectionStepShell>
    );
  }

  return (
    <ReflectionStepShell
      step={3}
      footer={
        <>
          {!canContinue && (
            <p className="text-center font-inter text-sm italic text-ink-soft">
              Select at least one barrier to continue.
            </p>
          )}
          <ContinueButton
            href={canContinue ? "/onboarding/reveal" : undefined}
            disabled={!canContinue}
            variant="terracotta"
          >
            See my tribe →
          </ContinueButton>
          <p className="text-center">
            <TextLink href="/onboarding/q2">← Back to step 2</TextLink>
          </p>
        </>
      }
    >
      <div className="space-y-2">
        <Eyebrow>Q3 · what gets in the way</Eyebrow>
        <Headline>What gets in the way?</Headline>
      </div>

      <BarrierPillGroup selected={q3Barriers} onToggle={toggleBarrier} />

      <p className="font-inter text-sm italic text-ink-soft">
        Select all that apply. KinMatch works around these, not against you.
      </p>
    </ReflectionStepShell>
  );
}
