import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

type ProfileTopBarProps = {
  friendName: string;
  onMore?: () => void;
};

export function ProfileTopBar({ friendName, onMore }: ProfileTopBarProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-ink/[0.12] px-5 py-2">
      <Link
        href="/today"
        className="font-inter text-sm text-terracotta underline underline-offset-2"
      >
        ← Today
      </Link>
      <span className="font-sans text-[13px] font-medium text-ink">
        {friendName}
      </span>
      <button
        type="button"
        onClick={onMore}
        className="ml-auto flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.04]"
        aria-label="More options"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
