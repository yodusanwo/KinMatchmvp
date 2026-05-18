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
  { number: 1, title: "Who are your people?" },
  { number: 2, title: "Who do you wish were closer?" },
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
          Three quick questions help us tune KinMatch to your relationships.
          Most people finish in under two minutes.
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
