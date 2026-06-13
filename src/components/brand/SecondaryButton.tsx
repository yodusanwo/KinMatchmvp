import { cn } from "@/lib/cn";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Secondary action: a carbon-navy command slab, white uppercase label, sharp. */
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
        "kin-halftone inline-flex w-full items-center justify-center rounded-none border-b-2 border-b-black bg-carbon px-6 py-3 font-sans text-xs font-bold uppercase tracking-[0.5px] text-white transition-colors duration-100 ease-out",
        "hover:bg-[#2c3040] active:translate-y-px",
        "disabled:cursor-not-allowed disabled:bg-muted-indigo disabled:text-ash",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
