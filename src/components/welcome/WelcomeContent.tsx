import Link from "next/link";
import { BrandMark, PrimaryLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeSessionSync } from "./WelcomeSessionSync";
import type { WelcomeAuthState } from "@/lib/auth/welcome-state";

// Outlined "see the research / sign in" secondary — transparent on the
// lavender field with a thin carbon border (matches the landing composition).
const secondaryLinkClassName =
  "inline-flex w-full items-center justify-center rounded-xs border border-carbon bg-transparent px-6 py-3 font-sans text-xs font-bold uppercase tracking-[0.5px] text-ink transition-colors duration-100 hover:bg-carbon/[0.06]";

export function WelcomeContent({ auth }: { auth: WelcomeAuthState }) {
  const isGuest = auth.status === "guest";

  return (
    <AppShell>
      <WelcomeSessionSync showForGuest={isGuest} />
      {/* Landing-style faceplate: carbon command masthead over a full-bleed
          lavender field carrying a towering outlined box-art lockup, an
          orange forward CTA, and an outlined secondary. */}
      <main className="flex min-h-screen flex-col bg-lavender">
        {/* Carbon command masthead */}
        <header className="kin-halftone flex items-center border-b-2 border-b-black bg-carbon px-5 py-3">
          <Link href={isGuest ? "/" : "/today"} className="flex items-center gap-2">
            <BrandMark size={26} />
            <span className="font-display text-base tracking-[0.5px]">
              <span className="text-white">Kin</span>
              <span className="text-signal">Match</span>
            </span>
          </Link>
        </header>

        <div className="flex flex-1 flex-col px-6 pt-10">
          {isGuest ? (
            <>
              <h1 className="font-display text-[46px] uppercase leading-[0.95]">
                <span className="kin-boxart">Turn your connections into </span>
                <span className="kin-boxart-accent">community.</span>
              </h1>

              <p className="mt-7 font-sans text-[16px] text-ink">
                For people <em className="font-bold not-italic">who want connection.</em>
              </p>

              <p className="mt-4 max-w-sm font-sans text-[16px] leading-relaxed text-ink">
                You have <strong className="font-bold">people in your contacts</strong> — but
                not a community you can count on. <strong className="font-bold">KinMatch</strong>{" "}
                uses behavioral science to help you deepen the friendships you
                already have, and build the local chosen family you&apos;ve been
                missing.
              </p>

              <div className="mt-9 space-y-3">
                <PrimaryLink href="/signin?next=/onboarding/name">
                  Get started →
                </PrimaryLink>
                <Link href="/signin?next=/today" className={secondaryLinkClassName}>
                  Already have an account? Sign in
                </Link>
              </div>

              <p className="mt-7 max-w-sm font-sans text-[13px] leading-relaxed text-ink-soft">
                Built on behavioral-science research into{" "}
                <strong className="font-bold text-ink">friendship</strong>,{" "}
                <strong className="font-bold text-ink">belonging</strong>, and{" "}
                <strong className="font-bold text-ink">connection</strong>.
              </p>
            </>
          ) : auth.status === "onboarding" ? (
            <>
              <h1 className="font-display text-[46px] uppercase leading-[0.95]">
                <span className="kin-boxart">Welcome </span>
                <span className="kin-boxart-accent">back.</span>
              </h1>

              <p className="mt-7 max-w-sm font-sans text-[16px] leading-relaxed text-ink">
                {auth.email ? (
                  <>
                    Signed in as{" "}
                    <strong className="font-bold">{auth.email}</strong>. Finish
                    your reflection to set up your tribe.
                  </>
                ) : (
                  <>
                    You&apos;re signed in. Finish your reflection to set up your
                    tribe.
                  </>
                )}
              </p>

              <div className="mt-9 space-y-3">
                <PrimaryLink href="/onboarding/name">
                  Continue your setup →
                </PrimaryLink>
                <Link href="/profile" className={secondaryLinkClassName}>
                  Account
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
