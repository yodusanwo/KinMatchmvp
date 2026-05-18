import {
  BrandMark,
  Headline,
  PrimaryLink,
  Subhead,
  TextLink,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeSessionSync } from "./WelcomeSessionSync";
import type { WelcomeAuthState } from "@/lib/auth/welcome-state";

export function WelcomeContent({ auth }: { auth: WelcomeAuthState }) {
  const isGuest = auth.status === "guest";

  return (
    <AppShell>
      <WelcomeSessionSync showForGuest={isGuest} />
      <main className="flex min-h-screen flex-col justify-between px-5 py-12">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BrandMark size={56} className="mb-6" />
          <p className="font-inter text-2xl italic text-terracotta">KinMatch</p>
          <p className="mt-3 font-inter text-lg italic text-ink-soft">
            Turn connections into community
          </p>

          {isGuest ? (
            <>
              <Headline className="mt-8 max-w-xs text-center">
                Stay close to the people who matter most.
              </Headline>
              <Subhead className="mt-4 max-w-xs text-center">
                A behavioral science based way to tend the friendships you&apos;re
                building in life.
              </Subhead>
            </>
          ) : auth.status === "onboarding" ? (
            <>
              <Headline className="mt-8 max-w-xs text-center">
                Welcome back
              </Headline>
              <Subhead className="mt-4 max-w-xs text-center">
                {auth.email ? (
                  <>
                    Signed in as{" "}
                    <span className="text-ink">{auth.email}</span>. Finish your
                    reflection to set up your tribe.
                  </>
                ) : (
                  <>
                    You&apos;re signed in. Finish your reflection to set up your
                    tribe.
                  </>
                )}
              </Subhead>
            </>
          ) : null}
        </div>

        <div className="space-y-4 pb-4">
          {isGuest ? (
            <>
              <PrimaryLink href="/signin?next=/onboarding">Get started</PrimaryLink>
              <p className="text-center">
                <TextLink href="/signin?next=/today">
                  Already have an account? Sign in
                </TextLink>
              </p>
            </>
          ) : auth.status === "onboarding" ? (
            <>
              <PrimaryLink href="/onboarding">Continue your setup</PrimaryLink>
              <p className="text-center">
                <TextLink href="/profile">Account</TextLink>
              </p>
            </>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
