import Link from "next/link";
import { Eyebrow } from "@/components/brand";
import type { FriendSummary } from "@/lib/api/types";
import { formatDisplayName } from "@/lib/names/format";

type MomentumSectionProps = {
  growing: FriendSummary[];
  stable: FriendSummary[];
  needsAttention: FriendSummary[];
};

type MomentumCategoryProps = {
  label: string;
  friends: FriendSummary[];
  emptyMessage?: string;
};

function MomentumCategory({ label, friends, emptyMessage }: MomentumCategoryProps) {
  if (friends.length === 0 && emptyMessage) {
    return (
      <div>
        <p className="font-sans text-sm font-semibold text-ink">{label}:</p>
        <p className="mt-1 font-inter text-sm italic text-ink-soft">{emptyMessage}</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="font-sans text-sm font-semibold text-ink">{label}:</p>
      <p className="mt-1 font-inter text-sm text-ink">
        {friends.map((friend, index) => (
          <span key={friend.id}>
            <Link
              href={`/friends/${friend.id}`}
              className="text-terracotta underline decoration-terracotta/60 underline-offset-2 hover:text-terracotta-deep"
            >
              {formatDisplayName(friend.name)}
            </Link>
            {index < friends.length - 1 && ", "}
          </span>
        ))}
      </p>
    </div>
  );
}

export function MomentumSection({
  growing,
  stable,
  needsAttention,
}: MomentumSectionProps) {
  return (
    <section className="rounded-2xl border border-ink/[0.12] bg-cream-deep/80 p-5">
      <Eyebrow>friendship momentum</Eyebrow>
      <div className="mt-4 space-y-3">
        <MomentumCategory label="Growing" friends={growing} />
        <MomentumCategory label="Stable" friends={stable} />
        <MomentumCategory
          label="Needs Attention"
          friends={needsAttention}
          emptyMessage="Everyone's on rhythm"
        />
      </div>
    </section>
  );
}
