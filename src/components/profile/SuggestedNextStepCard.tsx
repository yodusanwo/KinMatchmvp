import type { ReactNode } from "react";
import Link from "next/link";
import { Mic } from "lucide-react";
import { Subhead } from "@/components/brand";
import { cn } from "@/lib/cn";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";

type SuggestedNextStepCardProps = {
  href: string;
  quote: string;
  whyThisWorks?: string | null;
  capturePrompt?: string;
  ctaLabel: string;
  sendMethodHint?: ReactNode;
  className?: string;
};

export function SuggestedNextStepCard({
  href,
  quote,
  whyThisWorks,
  capturePrompt,
  ctaLabel,
  sendMethodHint,
  className,
}: SuggestedNextStepCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-ink/[0.12] bg-cream-deep/80 p-3.5",
        className
      )}
    >
      <Subhead className="text-sm leading-relaxed">
        {whyThisWorks ? `“${quote}”` : quote}
      </Subhead>
      {capturePrompt && (
        <p className="mt-3 font-sans text-sm font-semibold leading-relaxed text-ink">
          {capturePrompt}
        </p>
      )}
      {whyThisWorks && (
        <p className="mt-3 font-inter text-xs italic leading-relaxed text-ink-soft">
          {whyThisWorks}
        </p>
      )}
      <Link
        href={href}
        className={cn(primaryButtonClassName, "mt-3 gap-2 py-2.5 text-xs")}
      >
        {!capturePrompt && (
          <Mic className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        )}
        {ctaLabel}
      </Link>
      {sendMethodHint && (
        <p className="mt-2 text-center font-inter text-[11px] italic text-ink-soft">
          {sendMethodHint}
        </p>
      )}
    </article>
  );
}
