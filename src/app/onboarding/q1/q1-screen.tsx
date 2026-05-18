"use client";

import { Eyebrow, Headline, TextLink } from "@/components/brand";
import { AddNameInput } from "@/components/onboarding/AddNameInput";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { NameChipList } from "@/components/onboarding/NameChipList";
import { ReflectionStepShell } from "@/components/onboarding/ReflectionStepShell";
import { useOnboarding } from "@/contexts/onboarding-context";

const REFLECTION_COPY_CLASS =
  "font-inter text-sm italic leading-[1.5] text-[rgba(31,26,20,0.65)]";

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
        <Headline>Who are your people?</Headline>
        <p className={REFLECTION_COPY_CLASS}>
          The friends and close family you actually spend time with — the ones
          you&apos;d describe as your inner circle.
        </p>
      </div>

      <NameChipList people={q1People} onRemove={removeQ1Person} />

      <AddNameInput placeholder="Add another name…" onAdd={addQ1Person} />

      <p className={REFLECTION_COPY_CLASS}>
        5 to 10 people is a good start. Skip casual acquaintances and
        &ldquo;we should hang out sometime&rdquo; contacts — we&apos;ll get to
        those next.
      </p>
    </ReflectionStepShell>
  );
}
