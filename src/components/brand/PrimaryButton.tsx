import { cn } from "@/lib/cn";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Terracotta pill CTA for brand-defining moments. */
export function PrimaryButton({
  children,
  className,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-full bg-terracotta px-6 py-3.5 font-sans text-sm font-medium text-cream transition-colors duration-250 ease-out",
        "hover:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
