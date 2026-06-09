import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

/** 11px uppercase label, Instrument Sans, 0.12em tracking. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink",
        className
      )}
    >
      {children}
    </p>
  );
}
