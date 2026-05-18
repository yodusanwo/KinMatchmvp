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
  {
    number: 1,
    title: "Who you spend time with",
    description:
      "Name the people in your life right now — the ones who show up.",
  },
  {
    number: 2,
    title: "Who you wish were closer",
    description:
      "Mark the connections you want to deepen.",
  },
  {
    number: 3,
    title: "What gets in the way",
    description:
      "Tell us what makes staying in touch hard for you. Based on what you share, KinMatch helps make keeping in touch easier.",
  },
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

        <Subhead className="text-center">
          Next, we need you to answer three short questions. It&apos;ll take about
          two minutes.
        </Subhead>

        <NumberedSteps steps={REFLECTION_STEPS} />

        <PrimaryLink href="/onboarding/q1" className="mt-2">
          Begin reflection →
        </PrimaryLink>
      </div>
    </AppShell>
  );
}
