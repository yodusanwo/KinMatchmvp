"use client";

import { Eyebrow, Headline, TextLink } from "@/components/brand";
import { AddNameInput } from "@/components/onboarding/AddNameInput";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { NameChipList } from "@/components/onboarding/NameChipList";
import { ReflectionStepShell } from "@/components/onboarding/ReflectionStepShell";
import { useOnboarding } from "@/contexts/onboarding-context";

const REFLECTION_COPY_CLASS =
  "font-inter text-sm italic leading-[1.5] text-[rgba(31,26,20,0.65)]";

export function Q2Screen() {
  const { q2People, addQ2Person, removeQ2Person, hydrated } = useOnboarding();

  const count = q2People.length;
  const canContinue = count > 0;

  if (!hydrated) {
    return (
      <ReflectionStepShell step={2}>
        <p className="text-ink-soft">Loading…</p>
      </ReflectionStepShell>
    );
  }

  return (
    <ReflectionStepShell
      step={2}
      footer={
        <>
          {!canContinue && (
            <p className="text-center font-inter text-sm italic text-ink-soft">
              Add at least one name to continue.
            </p>
          )}
          <ContinueButton href={canContinue ? "/onboarding/q3" : undefined} disabled={!canContinue}>
            Continue to step 3 →
          </ContinueButton>
          <p className="text-center">
            <TextLink href="/onboarding/q1">← Back to step 1</TextLink>
          </p>
        </>
      }
    >
      <div className="space-y-2">
        <Eyebrow>Q2 · growing closer · {count}</Eyebrow>
        <Headline>Who do you wish were closer?</Headline>
        <p className={REFLECTION_COPY_CLASS}>
          Anyone you want to invest more in — long-distance friends, family far
          away, drifting friendships, acquaintances you&apos;d like to deepen,
          or people from step 1 you want to grow even closer with.
        </p>
      </div>

      <NameChipList people={q2People} onRemove={removeQ2Person} />

      <AddNameInput
        placeholder="Someone you'd like to know better…"
        onAdd={addQ2Person}
      />

      <p className={REFLECTION_COPY_CLASS}>
        Anyone counts. Adding someone from step 1 just means you want to grow
        what&apos;s already there.
      </p>
    </ReflectionStepShell>
  );
}
