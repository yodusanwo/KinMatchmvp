import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

/** Silkscreen-legend chrome label: uppercase Arial bold, 0.5px tracking. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-sans text-[11px] font-bold uppercase tracking-[0.5px] text-ink-soft",
        className
      )}
    >
      {children}
    </p>
  );
}
