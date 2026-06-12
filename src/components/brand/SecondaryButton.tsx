import { cn } from "@/lib/cn";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Secondary action: white pane, ink label, 1px ink outline, 8px radius. */
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
        "inline-flex w-full items-center justify-center rounded-sm border border-ink bg-cream px-6 py-3.5 font-sans text-base font-medium text-ink transition-colors duration-200 ease-out",
        "hover:bg-cream-deep",
        "disabled:cursor-not-allowed disabled:border-hairline-strong disabled:text-stone",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
