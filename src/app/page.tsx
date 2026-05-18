import { redirect } from "next/navigation";
import {
  BrandMark,
  Headline,
  PrimaryLink,
  Subhead,
  TextLink,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed_at) {
      redirect("/today");
    }
    redirect("/onboarding");
  }

  return (
    <AppShell>
      <main className="flex min-h-screen flex-col justify-between px-5 py-12">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BrandMark size={56} className="mb-6" />
          <p className="font-inter text-2xl italic text-terracotta">KinMatch</p>
          <p className="mt-3 font-inter text-lg italic text-ink-soft">
            Friendship, on rhythm.
          </p>
          <Headline className="mt-8 max-w-xs text-center">
            Stay close to the people who matter most.
          </Headline>
          <Subhead className="mt-4 max-w-xs text-center">
            A calm, voice-first way to tend the friendships you&apos;re building
            life with.
          </Subhead>
        </div>

        <div className="space-y-4 pb-4">
          <PrimaryLink href="/onboarding">Get started</PrimaryLink>
          <p className="text-center">
            <TextLink href="/signin">Already have an account? Sign in</TextLink>
          </p>
        </div>
      </main>
    </AppShell>
  );
}
