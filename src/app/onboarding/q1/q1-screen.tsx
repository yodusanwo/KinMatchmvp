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
  const {
    userName,
    setUserName,
    q1People,
    addQ1Person,
    removeQ1Person,
    hydrated,
  } = useOnboarding();

  const count = q1People.length;
  const hasUserName = userName.trim().length >= 2;
  const canContinue = hasUserName && count > 0;

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
              Add your name and at least one person to continue.
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
        <Eyebrow>Q1 · people in your life · {count}</Eyebrow>
        <Headline>Who comes to mind?</Headline>
        <p className={REFLECTION_COPY_CLASS}>
          Brain-dump as many names as you can: close friends, family, regular
          community, coworkers, neighbors, and people you cross paths with.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
          Your name
        </span>
        <input
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
          placeholder="What should we call you?"
          className="w-full rounded-2xl border border-ink/[0.18] bg-cream px-4 py-3 font-inter text-sm text-ink placeholder:text-ink-soft/60 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
        />
      </label>

      <NameChipList people={q1People} onRemove={removeQ1Person} />

      <AddNameInput placeholder="Add another name…" onAdd={addQ1Person} />

      <p className={REFLECTION_COPY_CLASS}>
        Don&apos;t classify yet. The next step will help you sort each person
        into inner circle, village, or acquaintance.
      </p>
    </ReflectionStepShell>
  );
}
