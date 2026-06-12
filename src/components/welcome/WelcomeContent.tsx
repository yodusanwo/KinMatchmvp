import {
  BrandMark,
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
      {/* Nike editorial hero: white canvas, towering uppercase display lockup
          burned lower-left, monochrome, anchored by a single black pill CTA. */}
      <main className="flex min-h-screen flex-col justify-between px-6 py-14">
        <div className="flex items-center gap-2.5">
          <BrandMark size={40} />
          <span className="font-display text-2xl uppercase tracking-wide text-ink">
            KinMatch
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-end">
          {isGuest ? (
            <>
              <p className="font-sans text-sm font-medium uppercase tracking-[0.2em] text-mute">
                Turn connections into community
              </p>
              <h1 className="mt-3 font-display text-[64px] uppercase leading-[0.9] tracking-[-0.01em] text-ink">
                Stay close to your people.
              </h1>
              <Subhead className="mt-5 max-w-xs">
                A science-based way to deepen the friendships you&apos;re building
                in life.
              </Subhead>
            </>
          ) : auth.status === "onboarding" ? (
            <>
              <p className="font-sans text-sm font-medium uppercase tracking-[0.2em] text-mute">
                Welcome back
              </p>
              <h1 className="mt-3 font-display text-[64px] uppercase leading-[0.9] tracking-[-0.01em] text-ink">
                Pick up where you left off.
              </h1>
              <Subhead className="mt-5 max-w-xs">
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
              <PrimaryLink href="/signin?next=/onboarding/name">Get started</PrimaryLink>
              <p className="text-center">
                <TextLink href="/signin?next=/today" className="!text-ink hover:!text-ink">
                  Already have an account? Sign in
                </TextLink>
              </p>
            </>
          ) : auth.status === "onboarding" ? (
            <>
              <PrimaryLink href="/onboarding/name">Continue your setup</PrimaryLink>
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
