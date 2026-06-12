import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

/** Uppercase bold caption eyebrow over a section heading. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-sans text-[14px] font-bold uppercase tracking-[0.08em] text-ink",
        className
      )}
    >
      {children}
    </p>
  );
}
