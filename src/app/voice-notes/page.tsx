import { BrandBar, Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { requireOnboardedUser } from "@/lib/auth/require-user";

/** Placeholder — voice inbox ships Day 11. */
export default async function VoiceNotesPage() {
  await requireOnboardedUser("/voice-notes");

  return (
    <AppShell>
      <BrandBar />
      <div className="space-y-4 px-5 py-10 pb-28">
        <Eyebrow>Voice notes</Eyebrow>
        <Headline>Your inbox</Headline>
        <Subhead>
          When friends send you voice notes, they&apos;ll appear here. Coming on
          Day 11.
        </Subhead>
        <TextLink href="/today">← Back to Today</TextLink>
      </div>
      <BottomNav />
    </AppShell>
  );
}
