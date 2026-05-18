"use client";

import { Eyebrow, Headline, TextLink } from "@/components/brand";
import { AddNameInput } from "@/components/onboarding/AddNameInput";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { NameChipList } from "@/components/onboarding/NameChipList";
import { ReflectionStepShell } from "@/components/onboarding/ReflectionStepShell";
import { useOnboarding } from "@/contexts/onboarding-context";

export function Q1Screen() {
  const { q1People, addQ1Person, removeQ1Person, hydrated } = useOnboarding();

  const count = q1People.length;
  const canContinue = count > 0;

  if (!hydrated) {
    return (
      <ReflectionStepShell step={1}>
        <p className="text-ink-soft">Loading…</p>
      </ReflectionStepShell>
    );
  }

  return (
    <ReflectionStepShell
      step={1}
      footer={
        <>
          {!canContinue && (
            <p className="text-center font-inter text-sm italic text-ink-soft">
              Add at least one name to continue.
            </p>
          )}
          <ContinueButton
            href={canContinue ? "/onboarding/q2" : undefined}
            disabled={!canContinue}
          >
            Continue to step 2 →
          </ContinueButton>
          <p className="text-center">
            <TextLink href="/onboarding">← Back to intro</TextLink>
          </p>
        </>
      }
    >
      <div className="space-y-2">
        <Eyebrow>Q1 · your tribe so far · {count}</Eyebrow>
        <Headline>Who&apos;s in your life right now?</Headline>
      </div>

      <NameChipList people={q1People} onRemove={removeQ1Person} />

      <AddNameInput placeholder="Add another name…" onAdd={addQ1Person} />

      <p className="font-inter text-sm italic text-ink-soft">
        5 to 10 people is a good start.
      </p>
    </ReflectionStepShell>
  );
}
