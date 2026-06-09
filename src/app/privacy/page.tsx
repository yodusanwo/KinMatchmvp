import Link from "next/link";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";

export default function PrivacyPage() {
  return (
    <AppShell>
      <BrandBar />
      <article className="mx-auto max-w-lg px-5 pb-16 pt-8">
        <Eyebrow>privacy</Eyebrow>
        <Headline className="mt-2">How KinMatch handles your people.</Headline>

        <div className="mt-8 space-y-6 font-inter text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Friend phone numbers
            </h2>
            <p className="mt-2">
              Phone numbers you save for friends are stored on KinMatch&apos;s
              servers to enable the one-tap send feature. KinMatch never sends
              SMS, calls, or any communication to these numbers, they are only
              used to pre-fill your phone&apos;s Messages app when you send a
              voice note.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              What stays on your phone
            </h2>
            <p className="mt-2">
              When you tap send, your device opens Messages with the recipient
              and message ready. You choose whether to actually send, KinMatch
              does not send texts on your behalf.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-ink">
              Editing or removing numbers
            </h2>
            <p className="mt-2">
              You can add, change, or remove a friend&apos;s number anytime from
              their profile or from your account settings under friend contact
              info.
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
