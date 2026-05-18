import { cn } from "@/lib/cn";

type ProgressDotsProps = {
  filled: number;
  total: number;
  className?: string;
};

export function ProgressDots({ filled, total, className }: ProgressDotsProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={filled}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${filled} of ${total}`}
      className={cn("flex gap-2", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-250 ease-out",
            i < filled ? "bg-terracotta" : "bg-cream-deep"
          )}
        />
      ))}
    </div>
  );
}
