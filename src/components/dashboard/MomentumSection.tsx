import Link from "next/link";
import { Check, TrendingUp } from "lucide-react";
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
  trend?: boolean;
};

function MomentumCategory({ label, friends, trend = false }: MomentumCategoryProps) {
  if (friends.length === 0) return null;

  return (
    <div>
      <p className="font-sans text-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 font-sans text-sm leading-relaxed text-ink">
        {friends.map((friend, index) => (
          <span key={friend.id}>
            <span className="whitespace-nowrap">
              <Link
                href={`/friends/${friend.id}`}
                className="font-medium text-ink underline decoration-transparent underline-offset-2 transition-colors hover:decoration-ink/40"
              >
                {formatDisplayName(friend.name)}
              </Link>
              {trend && (
                <TrendingUp
                  className="mx-0.5 inline h-3.5 w-3.5 -translate-y-px text-ink-soft"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
            </span>
            {index < friends.length - 1 && <span className="text-slate">, </span>}
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
    <section className="rounded-lg border border-hairline bg-cream-deep p-5">
      <Eyebrow>friendship momentum</Eyebrow>
      <div className="mt-4 space-y-3">
        <MomentumCategory label="Growing" friends={growing} trend />
        <MomentumCategory label="Stable" friends={stable} />
        {needsAttention.length > 0 ? (
          <MomentumCategory label="Needs attention" friends={needsAttention} />
        ) : (
          <div>
            <p className="font-sans text-sm font-semibold text-ink">Needs attention</p>
            <p className="mt-1 flex items-center gap-1.5 font-sans text-sm text-ink">
              <Check className="h-4 w-4 shrink-0 text-ink" strokeWidth={2.5} aria-hidden />
              Everyone&apos;s on rhythm
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
