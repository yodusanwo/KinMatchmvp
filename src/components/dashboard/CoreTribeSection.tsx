import { Eyebrow } from "@/components/brand";
import type { FriendSummary } from "@/lib/api/types";
import { firstName } from "@/lib/memories/categories";

type CoreTribeSectionProps = {
  friends: FriendSummary[];
};

export function CoreTribeSection({ friends }: CoreTribeSectionProps) {
  if (friends.length === 0) {
    return (
      <section>
        <Eyebrow>your core tribe</Eyebrow>
        <p className="mt-3 font-inter text-sm italic text-ink-soft">
          Your closest friends will appear here.
        </p>
      </section>
    );
  }

  const names = friends.map((f) => firstName(f.name)).join(" • ");

  return (
    <section>
      <Eyebrow>your core tribe</Eyebrow>
      <p className="mt-3 font-sans text-base font-medium text-ink">{names}</p>
    </section>
  );
}
