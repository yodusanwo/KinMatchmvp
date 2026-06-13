import { cn } from "@/lib/cn";

type SubheadProps = {
  children: React.ReactNode;
  className?: string;
};

/** Italic subhead — warm slate, sits under the display heading. */
export function Subhead({ children, className }: SubheadProps) {
  return (
    <p
      className={cn(
        "font-sans text-base italic leading-relaxed text-slate",
        className
      )}
    >
      {children}
    </p>
  );
}
