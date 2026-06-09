import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryLink,
  Subhead,
  TextLink,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { NumberedSteps } from "@/components/onboarding/NumberedSteps";
import { OnboardingStartedTracker } from "@/components/onboarding/OnboardingStartedTracker";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const REFLECTION_STEPS = [
  { number: 1, title: "List people in your life" },
  { number: 2, title: "Sort them into circles" },
  { number: 3, title: "What gets in the way?" },
];

function formatDisplayName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export default async function OnboardingIntroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?next=/onboarding/name");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.name?.trim();
  if (!name) {
    redirect("/onboarding/name");
  }

  return (
    <AppShell>
      <OnboardingStartedTracker />
      <BrandBar />
      <div className="space-y-8 px-5 py-8">
        <div className="space-y-2">
          <Eyebrow>Before we begin</Eyebrow>
          <Headline>A small reflection, {formatDisplayName(name)}.</Headline>
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

        <p className="text-center">
          <TextLink href="/onboarding/name">change name</TextLink>
        </p>
      </div>
    </AppShell>
  );
}
