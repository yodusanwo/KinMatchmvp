import { BrandBar, Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { requireOnboardedUser } from "@/lib/auth/require-user";

/** Placeholder — full Held tab ships Day 10. */
export default async function HeldPage() {
  await requireOnboardedUser("/held");

  return (
    <AppShell>
      <BrandBar />
      <div className="space-y-4 px-5 py-10 pb-28">
        <Eyebrow>Held</Eyebrow>
        <Headline>A quiet circle of care</Headline>
        <Subhead>
          The full Held tab lands on Day 10. Your Held relationships from
          onboarding are already saved.
        </Subhead>
        <TextLink href="/today">← Back to Today</TextLink>
      </div>
      <BottomNav heldBadge />
    </AppShell>
  );
}
