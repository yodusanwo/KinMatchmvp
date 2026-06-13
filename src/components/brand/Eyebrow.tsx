import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

/** Silkscreen-legend chrome label — pixel face, uppercase, tight tracking. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-pixel text-[14px] uppercase tracking-[1px] text-ink-soft",
        className
      )}
    >
      {children}
    </p>
  );
}
