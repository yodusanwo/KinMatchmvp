"use client";

import { useEffect } from "react";
import { Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { AddNameInput } from "@/components/onboarding/AddNameInput";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { NameChipList } from "@/components/onboarding/NameChipList";
import { ReflectionStepShell } from "@/components/onboarding/ReflectionStepShell";
import { useOnboarding } from "@/contexts/onboarding-context";
import { mergeQ1IntoQ2 } from "@/lib/onboarding/person-utils";

export function Q2Screen() {
  const {
    q1People,
    q2People,
    setQ2People,
    addQ2Person,
    removeQ2Person,
    hydrated,
  } = useOnboarding();

  useEffect(() => {
    if (!hydrated) return;
    setQ2People((prev) => mergeQ1IntoQ2(q1People, prev));
  }, [hydrated, q1People, setQ2People]);

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
        <Eyebrow>Q2 · wished closer · {count}</Eyebrow>
        <Headline>Who do you wish were closer?</Headline>
        <Subhead>
          Even people you rarely see. These are who we&apos;ll help you stay close
          to.
        </Subhead>
      </div>

      <NameChipList people={q2People} onRemove={removeQ2Person} />

      <AddNameInput
        placeholder="Someone you've been thinking about…"
        onAdd={addQ2Person}
      />

      <p className="font-inter text-sm italic text-ink-soft">
        Long-distance and drifting friends welcome here.
      </p>
    </ReflectionStepShell>
  );
}
