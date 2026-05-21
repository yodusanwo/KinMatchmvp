import { requireOnboardedUser } from "@/lib/auth/require-user";
import { OnboardingRitualsScreen } from "./rituals-screen";

export default async function OnboardingRitualsPage() {
  await requireOnboardedUser("/onboarding/rituals");
  return <OnboardingRitualsScreen />;
}
