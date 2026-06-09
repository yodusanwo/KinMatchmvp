import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/cn";

type EmailPreviewCardProps = {
  className?: string;
};

export function EmailPreviewCard({ className }: EmailPreviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink/[0.2] bg-cream-deep/80 p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <BrandMark size={20} />
        <span className="font-sans text-xs font-medium text-ink-soft">
          KinMatch
        </span>
      </div>
      <p className="font-sans text-sm font-medium text-ink">
        Sarah&apos;s been quiet for 18 days
      </p>
      <p className="mt-1 font-inter text-sm italic text-ink-soft">
        A gentle nudge, not an alarm. Tap when you have a moment.
      </p>
    </div>
  );
}
