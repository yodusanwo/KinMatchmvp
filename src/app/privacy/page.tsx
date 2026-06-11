import Link from "next/link";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";

export default function PrivacyPage() {
  return (
    <AppShell>
      <BrandBar />
      <article className="mx-auto max-w-2xl px-5 pb-16 pt-8">
        <Eyebrow>privacy policy</Eyebrow>
        <Headline className="mt-2">How KinMatch handles your data.</Headline>
        <p className="mt-3 font-inter text-sm text-ink/70">
          Last updated: June 10, 2026
        </p>

        <div className="mt-8 space-y-8 font-inter text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              What we collect
            </h2>
            <p className="mt-2">
              When you create an account, we collect your name and email address.
              If you sign in with Google, we also receive your profile picture from
              Google.
            </p>
            <p className="mt-2">
              When you add friends, we store the information you provide: their
              names, phone numbers (optional), birthdays (optional), relationship
              categories, and any notes you write about them.
            </p>
            <p className="mt-2">
              We also collect information about how you use the app: when you log
              in, which friends you view, when you send voice notes, and your
              responses to daily prompts.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              How we use your information
            </h2>
            <p className="mt-2">
              We use your data to provide and improve KinMatch. This includes:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Showing you personalized prompts and reminders</li>
              <li>Helping you remember details about your friends</li>
              <li>Pre-filling your phone&apos;s Messages app when you send voice notes</li>
              <li>Analyzing engagement patterns to surface friends you haven&apos;t connected with</li>
              <li>Improving our AI-powered features and recommendations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Friend phone numbers
            </h2>
            <p className="mt-2">
              Phone numbers you save for friends are stored securely on our servers
              to enable the one-tap send feature. KinMatch never sends SMS, calls,
              or any communication to these numbers. They are only used to pre-fill
              your phone&apos;s Messages app when you choose to send a voice note.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              What we don&apos;t do
            </h2>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>We don&apos;t send texts on your behalf</li>
              <li>We don&apos;t contact your friends</li>
              <li>We don&apos;t sell your data to third parties</li>
              <li>We don&apos;t share your friend information with anyone</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Third-party services
            </h2>
            <p className="mt-2">
              We use Google Sign-In as an authentication option. When you sign in
              with Google, we receive your name, email, and profile picture from
              Google according to their privacy policy. We also use Supabase for
              hosting and database services, which means your data is stored on
              their secure infrastructure.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Data retention and deletion
            </h2>
            <p className="mt-2">
              We keep your data as long as your account is active. You can delete
              individual friends or notes anytime from within the app. If you want
              to delete your entire account and all associated data, contact us at
              support@kinmatch.co.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Security
            </h2>
            <p className="mt-2">
              We take security seriously. Your data is encrypted in transit and at
              rest. We use industry-standard practices to protect your information,
              but no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Your rights
            </h2>
            <p className="mt-2">
              You have the right to access, correct, or delete your personal data.
              You can edit most information directly in the app. For data export or
              account deletion requests, email us at support@kinmatch.co.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Changes to this policy
            </h2>
            <p className="mt-2">
              We may update this privacy policy from time to time. We&apos;ll notify
              you of significant changes by email or through the app.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Contact us
            </h2>
            <p className="mt-2">
              If you have questions about this privacy policy, email us at
              support@kinmatch.co.
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
