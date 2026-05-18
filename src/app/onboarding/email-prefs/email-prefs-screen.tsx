"use client";

import { Eyebrow, Headline, Subhead } from "@/components/brand";
import { EmailPreviewCard } from "@/components/onboarding/EmailPreviewCard";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { AppShell } from "@/components/layout/AppShell";
import { BrandBar } from "@/components/brand";

export function EmailPrefsScreen() {
  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-[calc(100vh-65px)] flex-col justify-between px-5 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Eyebrow>Almost done</Eyebrow>
            <Headline>We&apos;ll email you, not interrupt you.</Headline>
          </div>

          <EmailPreviewCard />
          <Subhead className="text-ink-soft">
            Next you&apos;ll sign in with a one-time email link so we can save
            your tribe. Your answers stay on this device until then.
          </Subhead>
        </div>

        <div className="pb-4">
          <ContinueButton href="/signin?next=/onboarding/finish" variant="terracotta">
            Continue to sign in →
          </ContinueButton>
        </div>
      </div>
    </AppShell>
  );
}
