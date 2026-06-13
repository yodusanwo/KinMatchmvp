import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

/** Eyebrow over a section heading — uppercase, warm-muted, wide tracking. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-mute",
        className
      )}
    >
      {children}
    </p>
  );
}
