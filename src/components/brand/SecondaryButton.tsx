import { cn } from "@/lib/cn";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Outlined pill for secondary actions. */
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
        "inline-flex w-full items-center justify-center rounded-full border border-ink/[0.35] bg-transparent px-6 py-3.5 font-sans text-sm font-medium text-ink transition-colors duration-250 ease-out",
        "hover:border-ink hover:bg-cream-deep/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
