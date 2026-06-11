import Link from "next/link";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";

export default function TermsPage() {
  return (
    <AppShell>
      <BrandBar />
      <article className="mx-auto max-w-2xl px-5 pb-16 pt-8">
        <Eyebrow>terms of service</Eyebrow>
        <Headline className="mt-2">The basics of using KinMatch.</Headline>
        <p className="mt-3 font-inter text-sm text-ink/70">
          Last updated: June 10, 2026
        </p>

        <div className="mt-8 space-y-8 font-inter text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Acceptance of terms
            </h2>
            <p className="mt-2">
              By creating an account and using KinMatch, you agree to these terms.
              If you don&apos;t agree, please don&apos;t use the service.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              What KinMatch is
            </h2>
            <p className="mt-2">
              KinMatch is a tool to help you stay connected with the people who
              matter. It provides prompts, reminders, and an easy way to send voice
              notes to friends and family.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Your account
            </h2>
            <p className="mt-2">
              You&apos;re responsible for keeping your account secure. Don&apos;t
              share your login credentials with anyone. You must be at least 13
              years old to use KinMatch.
            </p>
            <p className="mt-2">
              You can create one account per email address. If we detect abuse or
              misuse, we may suspend or terminate your account.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Your content and data
            </h2>
            <p className="mt-2">
              You own the information you add to KinMatch — friend names, notes,
              memories, etc. By using the service, you give us permission to store
              and process this data to provide the features described in our app.
            </p>
            <p className="mt-2">
              You&apos;re responsible for the accuracy of the information you
              provide. Don&apos;t add information about people without their
              knowledge if it would violate their privacy.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Acceptable use
            </h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Use KinMatch for any illegal purpose</li>
              <li>Harass, abuse, or harm others</li>
              <li>Attempt to access other users&apos; accounts or data</li>
              <li>Interfere with or disrupt the service</li>
              <li>Use automated tools to scrape or access the service</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Voice notes and messaging
            </h2>
            <p className="mt-2">
              KinMatch helps you compose and send messages, but you&apos;re
              responsible for what you send. When you tap send, your phone&apos;s
              Messages app opens with the recipient and message ready — you control
              whether it actually gets sent.
            </p>
            <p className="mt-2">
              KinMatch doesn&apos;t send texts on your behalf and isn&apos;t
              responsible for the content of your messages.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              AI-powered features
            </h2>
            <p className="mt-2">
              KinMatch uses AI to analyze your friend data and provide
              personalized prompts and insights. These features are designed to
              help you stay connected, but the AI may occasionally make mistakes or
              provide imperfect suggestions. Use your judgment.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Service availability
            </h2>
            <p className="mt-2">
              We work hard to keep KinMatch running smoothly, but we can&apos;t
              guarantee 100% uptime. The service is provided &quot;as is&quot; and
              we may need to take it offline occasionally for maintenance or
              updates.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Limitation of liability
            </h2>
            <p className="mt-2">
              KinMatch is provided as-is, without warranties of any kind. We&apos;re
              not liable for any damages arising from your use of the service,
              including but not limited to lost data, missed connections, or
              relationship outcomes.
            </p>
            <p className="mt-2">
              To the maximum extent permitted by law, our total liability to you is
              limited to the amount you&apos;ve paid us in the past 12 months (which
              is currently $0, as KinMatch is free to use).
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Termination
            </h2>
            <p className="mt-2">
              You can stop using KinMatch anytime. If you want to delete your
              account and all data, contact us at support@kinmatch.co.
            </p>
            <p className="mt-2">
              We may suspend or terminate your account if you violate these terms
              or if we need to for legal or operational reasons.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Changes to terms
            </h2>
            <p className="mt-2">
              We may update these terms from time to time. If we make significant
              changes, we&apos;ll notify you by email or through the app. Continued
              use of KinMatch after changes means you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Governing law
            </h2>
            <p className="mt-2">
              These terms are governed by the laws of the State of New York, USA.
              Any disputes will be resolved in the courts of New York.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Contact us
            </h2>
            <p className="mt-2">
              Questions about these terms? Email us at support@kinmatch.co.
            </p>
          </section>
        </div>

        <Subhead className="mt-10">
          <Link
            href="/profile"
            className="text-terracotta underline decoration-terracotta/60 underline-offset-2"
          >
            ← Back to profile
          </Link>
        </Subhead>
      </article>
    </AppShell>
  );
}
