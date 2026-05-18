import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FinishScreen } from "./finish-screen";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingFinishPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?next=/onboarding/finish");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream text-ink-soft">
          Loading…
        </div>
      }
    >
      <FinishScreen />
    </Suspense>
  );
}
