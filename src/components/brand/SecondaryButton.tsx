import { cn } from "@/lib/cn";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Secondary action: ghost button — transparent, carbon outline + label. */
export function SecondaryButton({
  children,
  className,
  type = "button",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-[44px] w-full items-center justify-center rounded-sm border-[1.5px] border-carbon bg-transparent px-6 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-carbon transition-colors duration-150 ease-out",
        "hover:bg-carbon/[0.06] active:translate-y-px",
        "disabled:cursor-not-allowed disabled:border-hairline-strong disabled:text-stone",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
