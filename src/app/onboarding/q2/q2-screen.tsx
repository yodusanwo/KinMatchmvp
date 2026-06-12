"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eyebrow, Headline, TextLink } from "@/components/brand";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { ReflectionStepShell } from "@/components/onboarding/ReflectionStepShell";
import { useOnboarding } from "@/contexts/onboarding-context";
import type { CircleId } from "@/lib/onboarding/types";
import { cn } from "@/lib/cn";

const REFLECTION_COPY_CLASS =
  "font-inter text-sm italic leading-[1.5] text-[rgba(31,26,20,0.65)]";

const CIRCLE_OPTIONS: { id: CircleId; label: string }[] = [
  { id: "inner", label: "Inner circle" },
  { id: "village", label: "Village" },
  { id: "family", label: "Family" },
  { id: "acquaintance", label: "Acquaintance" },
];

export function Q2Screen() {
  const router = useRouter();
  const { q1People, circleAssignments, setCircleAssignment, hydrated } =
    useOnboarding();

  const assignedCount = q1People.filter(
    (person) => circleAssignments[person.id]
  ).length;
  const innerCount = q1People.filter(
    (person) => circleAssignments[person.id] === "inner"
  ).length;
  const canContinue = q1People.length > 0 && assignedCount === q1People.length && innerCount > 0;

  useEffect(() => {
    if (hydrated && q1People.length === 0) {
      router.replace("/onboarding/q1");
    }
  }, [hydrated, q1People.length, router]);

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
              Sort every person and include at least one inner-circle person.
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
        <Eyebrow>
          Q2 · sort your circles · {assignedCount}/{q1People.length}
        </Eyebrow>
        <Headline>Where does each person fit?</Headline>
        <p className={REFLECTION_COPY_CLASS}>
          Pick the circle that best matches your actual energy, time, and
          closeness right now. You can always change it later.
        </p>
      </div>

      <div className="space-y-3">
        {q1People.map((person) => (
          <section
            key={person.id}
            className="space-y-3 rounded-2xl border border-ink/[0.12] bg-cream-deep/35 p-3"
          >
            <div className="flex items-center gap-3">
              <MiniAvatar name={person.name} avatarColor={person.avatarColor} />
              <p className="font-sans text-sm font-medium text-ink">{person.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CIRCLE_OPTIONS.map((option) => {
                const selected = circleAssignments[person.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCircleAssignment(person.id, option.id)}
                    className={cn(
                      "rounded-full border px-3 py-2 font-sans text-[15px] font-medium transition-colors",
                      selected
                        ? "border-ink bg-cream-deep text-ink"
                        : "border-hairline text-ink-soft hover:border-ink hover:text-ink"
                    )}
                    aria-pressed={selected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className={REFLECTION_COPY_CLASS}>
        Inner circle is usually 2 to 5 people. Village is the wider group you
        see regularly or rely on. Acquaintances will live outside your main
        friends dashboard for now.
      </p>
    </ReflectionStepShell>
  );
}
