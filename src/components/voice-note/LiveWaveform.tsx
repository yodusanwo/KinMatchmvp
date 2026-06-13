import { cn } from "@/lib/cn";

type LiveWaveformProps = {
  peaks: number[];
  active?: boolean;
  className?: string;
};

export function LiveWaveform({ peaks, active = false, className }: LiveWaveformProps) {
  return (
    <div
      className={cn("flex h-16 items-end justify-center gap-1 px-4", className)}
      aria-hidden
    >
      {peaks.map((peak, index) => (
        <span
          key={index}
          className={cn(
            "w-1.5 rounded-full transition-all duration-150",
            active ? "bg-terracotta" : "bg-ink-soft/40"
          )}
          style={{ height: `${Math.round(12 + peak * 44)}px` }}
        />
      ))}
    </div>
  );
}
