import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryLink,
  Subhead,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { NumberedSteps } from "@/components/onboarding/NumberedSteps";

const REFLECTION_STEPS = [
  {
    number: 1,
    title: "Who you spend time with",
    description:
      "Name the people in your life right now — the ones who show up, even quietly.",
  },
  {
    number: 2,
    title: "Who you wish were closer",
    description:
      "Mark the connections you want to deepen. No judgment, just honesty.",
  },
  {
    number: 3,
    title: "What gets in the way",
    description:
      "Tell us what makes staying in touch hard. KinMatch works around it, not against you.",
  },
];

export default function OnboardingIntroPage() {
  return (
    <AppShell>
      <BrandBar />
      <div className="space-y-8 px-5 py-8">
        <div className="space-y-2">
          <Eyebrow>Before we begin</Eyebrow>
          <Headline>A small reflection, first.</Headline>
        </div>

        <Subhead className="text-center">
          Three short questions — about two minutes. The list below is a preview;
          you&apos;ll answer each one on the next screens.
        </Subhead>

        <NumberedSteps steps={REFLECTION_STEPS} />

        <PrimaryLink href="/onboarding/q1" className="mt-2">
          Begin reflection →
        </PrimaryLink>
      </div>
    </AppShell>
  );
}
