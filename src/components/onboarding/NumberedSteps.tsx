import { cn } from "@/lib/cn";

const STEP_COLORS = [
  "bg-terracotta text-cream",
  "bg-forest text-cream",
  "bg-mustard text-cream",
] as const;

type Step = {
  number: number;
  title: string;
  description?: string;
};

type NumberedStepsProps = {
  steps: Step[];
  className?: string;
  /** When true, all step circles use terracotta (email-prefs screen). */
  terracottaOnly?: boolean;
};

export function NumberedSteps({
  steps,
  className,
  terracottaOnly = false,
}: NumberedStepsProps) {
  return (
    <ol className={cn("space-y-5", className)}>
      {steps.map((step, index) => (
        <li key={step.number} className="flex gap-4">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-sm font-medium",
              terracottaOnly
                ? "bg-terracotta text-cream"
                : STEP_COLORS[index % STEP_COLORS.length]
            )}
            aria-hidden
          >
            {step.number}
          </span>
          <div className="pt-1">
            <p className="font-sans text-sm font-medium leading-snug text-ink">
              {step.title}
            </p>
            {step.description ? (
              <p className="mt-1 font-inter text-sm italic leading-relaxed text-ink-soft">
                {step.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
