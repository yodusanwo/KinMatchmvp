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
    <AppShell className="bg-surface-dark">
      <WelcomeSessionSync showForGuest={isGuest} />
      {/* NVIDIA-style black hero chapter: copy hugs the left, a single green
          square marks the corner, white display headline, one green CTA. */}
      <main className="relative flex min-h-screen flex-col justify-between px-6 py-14">
        <span
          className="absolute left-0 top-0 h-3 w-3 bg-terracotta"
          aria-hidden
        />

        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 flex items-center gap-2">
            <BrandMark size={36} />
            <span className="font-sans text-xl font-bold tracking-tight text-white">
              KinMatch
            </span>
          </div>

          <p className="mb-4 font-sans text-[14px] font-bold uppercase tracking-[0.08em] text-terracotta">
            Turn connections into community
          </p>

          {isGuest ? (
            <>
              <Headline className="max-w-sm !text-[40px] !leading-[1.1] !text-white">
                Stay close to the people who matter most.
              </Headline>
              <Subhead className="mt-5 max-w-xs !text-white/70">
                A science-based way to deepen the friendships you&apos;re building
                in life.
              </Subhead>
            </>
          ) : auth.status === "onboarding" ? (
            <>
              <Headline className="max-w-sm !text-[40px] !leading-[1.1] !text-white">
                Welcome back
              </Headline>
              <Subhead className="mt-5 max-w-xs !text-white/70">
                {auth.email ? (
                  <>
                    Signed in as{" "}
                    <span className="text-white">{auth.email}</span>. Finish your
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
                <TextLink
                  href="/signin?next=/today"
                  className="!text-white/70 hover:!text-white"
                >
                  Already have an account? Sign in
                </TextLink>
              </p>
            </>
          ) : auth.status === "onboarding" ? (
            <>
              <PrimaryLink href="/onboarding/name">Continue your setup</PrimaryLink>
              <p className="text-center">
                <TextLink href="/profile" className="!text-white/70 hover:!text-white">
                  Account
                </TextLink>
              </p>
            </>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
