import { cn } from "@/lib/cn";

const STEP_COLORS = [
  "bg-terracotta text-cream",
  "bg-forest text-cream",
  "bg-mustard text-ink",
] as const;

type Step = {
  number: number;
  title: string;
  description: string;
};

type NumberedStepsProps = {
  steps: Step[];
  className?: string;
};

export function NumberedSteps({ steps, className }: NumberedStepsProps) {
  return (
    <ol className={cn("space-y-5", className)}>
      {steps.map((step, index) => (
        <li key={step.number} className="flex gap-4">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-sm font-medium",
              STEP_COLORS[index % STEP_COLORS.length]
            )}
            aria-hidden
          >
            {step.number}
          </span>
          <div className="space-y-1 pt-0.5">
            <p className="font-sans text-sm font-medium text-ink">{step.title}</p>
            <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
