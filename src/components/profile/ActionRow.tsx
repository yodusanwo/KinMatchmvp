import Link from "next/link";

type ActionRowProps = {
  friendId: string;
};

export function ActionRow({ friendId }: ActionRowProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="flex-1 rounded-full border border-ink/[0.35] py-2.5 font-sans text-xs font-medium text-ink transition-colors hover:border-terracotta/50 hover:bg-cream-deep/50"
      >
        Text
      </button>
      <button
        type="button"
        className="flex-1 rounded-full border border-ink/[0.35] py-2.5 font-sans text-xs font-medium text-ink transition-colors hover:border-terracotta/50 hover:bg-cream-deep/50"
      >
        Call
      </button>
      <Link
        href={`/friends/${friendId}/plan`}
        className="flex-1 rounded-full border border-ink/[0.35] py-2.5 text-center font-sans text-xs font-medium text-ink transition-colors hover:border-terracotta/50 hover:bg-cream-deep/50"
      >
        Plan
      </Link>
    </div>
  );
}
