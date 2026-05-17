import { cn } from "@/lib/cn";

type SubheadProps = {
  children: React.ReactNode;
  className?: string;
};

/** Italic emotional line — Inter, ink-soft. */
export function Subhead({ children, className }: SubheadProps) {
  return (
    <p
      className={cn(
        "font-inter text-base italic leading-relaxed text-ink-soft",
        className
      )}
    >
      {children}
    </p>
  );
}
