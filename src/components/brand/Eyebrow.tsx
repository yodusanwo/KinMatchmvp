import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

/** Quiet sentence-case caption eyebrow over a section heading. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-sans text-[14px] font-medium text-ink-soft",
        className
      )}
    >
      {children}
    </p>
  );
}
