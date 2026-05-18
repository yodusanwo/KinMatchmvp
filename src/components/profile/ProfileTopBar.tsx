import Link from "next/link";

type ProfileTopBarProps = {
  friendName: string;
};

export function ProfileTopBar({ friendName }: ProfileTopBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-ink/[0.12] px-5 py-4">
      <Link
        href="/today"
        className="font-inter text-sm text-terracotta underline underline-offset-2"
      >
        ← Today
      </Link>
      <span className="font-sans text-sm font-medium text-ink">{friendName}</span>
      <button
        type="button"
        className="w-12 text-right font-sans text-lg text-ink-soft"
        aria-label="More options"
      >
        ···
      </button>
    </div>
  );
}
