import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryLink,
  Subhead,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { NumberedSteps } from "@/components/onboarding/NumberedSteps";
import { OnboardingStartedTracker } from "@/components/onboarding/OnboardingStartedTracker";

const REFLECTION_STEPS = [
  { number: 1, title: "List people in your life" },
  { number: 2, title: "Sort them into circles" },
  { number: 3, title: "What gets in the way?" },
];

export default function OnboardingIntroPage() {
  return (
    <AppShell>
      <OnboardingStartedTracker />
      <BrandBar />
      <div className="space-y-8 px-5 py-8">
        <div className="space-y-2">
          <Eyebrow>Before we begin</Eyebrow>
          <Headline>A small reflection, first.</Headline>
        </div>

        <Subhead>
          First, name the people who come to mind. Then we&apos;ll sort them
          into inner circle, village, or acquaintances so KinMatch knows who to
          help you tend.
        </Subhead>

        <NumberedSteps steps={REFLECTION_STEPS} />

        <p className="text-center font-inter text-sm italic leading-relaxed text-ink-soft">
          Your answers stay private. We only use them to shape your prompts.
        </p>

        <PrimaryLink href="/onboarding/q1" className="mt-2">
          Begin reflection →
        </PrimaryLink>
      </div>
    </AppShell>
  );
}
