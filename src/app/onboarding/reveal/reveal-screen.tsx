"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Eyebrow, Headline, Subhead } from "@/components/brand";
import { ConstellationView } from "@/components/onboarding/ConstellationView";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { ReflectionStepShell } from "@/components/onboarding/ReflectionStepShell";
import { useOnboarding } from "@/contexts/onboarding-context";

export function RevealScreen() {
  const router = useRouter();
  const { q1People, hydrated } = useOnboarding();

  const count = q1People.length;
  const subhead =
    count === 1
      ? "One person you've chosen to invest in."
      : `${count} people you've chosen to invest in.`;

  useEffect(() => {
    if (hydrated && count === 0) {
      router.replace("/onboarding/q1");
    }
  }, [hydrated, count, router]);

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
        <ContinueButton href="/onboarding/held">Continue</ContinueButton>
      }
    >
      <div className="space-y-2 text-center">
        <Eyebrow>Reflection complete</Eyebrow>
        <Headline>Here&apos;s your tribe.</Headline>
        <Subhead>{subhead}</Subhead>
      </div>

      <ConstellationView faces={q1People} className="py-4" />
    </ReflectionStepShell>
  );
}
