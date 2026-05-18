import Link from "next/link";
import { Subhead } from "@/components/brand";
import { cn } from "@/lib/cn";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";

type SuggestedNextStepCardProps = {
  friendId: string;
  prompt: string;
  className?: string;
};

export function SuggestedNextStepCard({
  friendId,
  prompt,
  className,
}: SuggestedNextStepCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-ink/[0.12] bg-cream-deep/80 p-5",
        className
      )}
    >
      <Subhead>{prompt}</Subhead>
      <Link
        href={`/friends/${friendId}/voice-note`}
        className={cn(primaryButtonClassName, "mt-4 block")}
      >
        Send voice note
      </Link>
    </article>
  );
}
