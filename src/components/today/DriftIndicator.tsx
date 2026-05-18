import { cn } from "@/lib/cn";

type DriftIndicatorProps = {
  daysQuiet: number;
  isDrifting: boolean;
  className?: string;
};

export function DriftIndicator({
  daysQuiet,
  isDrifting,
  className,
}: DriftIndicatorProps) {
  const label =
    daysQuiet === 0
      ? "On rhythm today"
      : daysQuiet === 1
        ? "1 day quiet"
        : `${daysQuiet} days quiet`;

  return (
    <span
      className={cn(
        "font-sans text-xs",
        isDrifting ? "text-terracotta-deep" : "text-ink-soft",
        className
      )}
    >
      {label}
    </span>
  );
}
