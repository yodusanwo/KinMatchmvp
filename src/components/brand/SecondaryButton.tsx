import { cn } from "@/lib/cn";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Secondary action: soft-cloud pill, ink label, no border (Nike). */
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
        "inline-flex w-full items-center justify-center rounded-full bg-cream-deep px-8 py-3.5 font-sans text-base font-medium text-ink transition-transform duration-150 ease-out",
        "hover:bg-surface-strong active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:text-stone",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
