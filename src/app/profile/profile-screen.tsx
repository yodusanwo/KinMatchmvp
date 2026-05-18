"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
  TextLink,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { createClient } from "@/lib/supabase/client";

type EmailPreferences = {
  daily_checkin?: boolean;
  sunday_voice_drop?: boolean;
  held_alerts?: boolean;
};

type ProfileScreenProps = {
  email: string;
  name: string | null;
  onboardingComplete: boolean;
  emailPreferences: EmailPreferences | null;
};

function prefLabel(on: boolean | undefined): string {
  return on === false ? "Off" : "On";
}

export function ProfileScreen({
  email,
  name,
  onboardingComplete,
  emailPreferences,
}: ProfileScreenProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/signin");
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-screen flex-col px-5 pb-28 pt-6">
        <Eyebrow>Your account</Eyebrow>
        <Headline className="mt-2">{name?.trim() || "Profile"}</Headline>
        <Subhead className="mt-2">{email}</Subhead>

        <dl className="mt-8 space-y-4 rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
          <div className="flex justify-between gap-4">
            <dt className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Name
            </dt>
            <dd className="font-inter text-sm text-ink">{name?.trim() || "—"}</dd>
          </div>
          <div  className="flex justify-between gap-4">
            <dt className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Email
            </dt>
            <dd className="font-inter text-sm text-ink">{email}</dd>
          </div>
          {onboardingComplete && emailPreferences && (
            <>
              <div className="border-t border-ink/[0.08] pt-4">
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                  Email preferences
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-inter text-sm text-ink-soft">Daily check-in</dt>
                <dd className="font-inter text-sm text-ink">
                  {prefLabel(emailPreferences.daily_checkin)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-inter text-sm text-ink-soft">Sunday voice drop</dt>
                <dd className="font-inter text-sm text-ink">
                  {prefLabel(emailPreferences.sunday_voice_drop)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-inter text-sm text-ink-soft">Held alerts</dt>
                <dd className="font-inter text-sm text-ink">
                  {prefLabel(emailPreferences.held_alerts)}
                </dd>
              </div>
            </>
          )}
        </dl>

        <p className="mt-6 font-inter text-sm text-ink-soft">
          You sign in with a magic link — no password. Use the button below to
          switch accounts on this device.
        </p>

        <div className="mt-8 space-y-4">
          {onboardingComplete && (
            <p className="text-center">
              <TextLink href="/today">← Back to Today</TextLink>
            </p>
          )}
          <PrimaryButton
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </PrimaryButton>
        </div>
      </div>
      {onboardingComplete && <BottomNav />}
    </AppShell>
  );
}
