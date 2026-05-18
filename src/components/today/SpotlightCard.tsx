import Link from "next/link";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import type { TodaySpotlight } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";

type SpotlightCardProps = {
  spotlight: TodaySpotlight;
  className?: string;
};

export function SpotlightCard({ spotlight, className }: SpotlightCardProps) {
  if (!spotlight) return null;

  const statusLabel =
    spotlight.days_quiet === 0
      ? "On rhythm"
      : `${spotlight.days_quiet} days quiet`;

  return (
    <article
      className={cn(
        "rounded-2xl border border-ink/[0.12] bg-cream-deep/80 p-5",
        className
      )}
    >
      <Link
        href={`/friends/${spotlight.friend_id}`}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <MiniAvatar
          name={spotlight.name}
          avatarColor={spotlight.avatar_color}
          size="md"
        />
        <div>
          <p className="font-sans text-base font-medium text-ink">
            {spotlight.name}
          </p>
          <p className="font-sans text-xs text-ink-soft">{statusLabel}</p>
        </div>
      </Link>

      <p className="mt-4 font-inter text-base italic leading-relaxed text-ink-soft">
        {spotlight.prompt_text}
      </p>

      <div className="mt-5 space-y-3">
        <Link
          href={`/friends/${spotlight.friend_id}/voice-note`}
          className={cn(primaryButtonClassName, "block")}
        >
          Send voice note
        </Link>
        <p className="text-center">
          <Link
            href={`/friends/${spotlight.friend_id}`}
            className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2"
          >
            View {spotlight.name}&apos;s profile
          </Link>
        </p>
      </div>
    </article>
  );
}
