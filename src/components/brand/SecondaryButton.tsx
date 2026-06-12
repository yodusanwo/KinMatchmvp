import { cn } from "@/lib/cn";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Secondary action: a clear pane bordered in NVIDIA Green, 2px corners. */
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
        "inline-flex w-full items-center justify-center rounded-sm border-2 border-terracotta bg-transparent px-6 py-3 font-sans text-sm font-bold text-ink transition-colors duration-150 ease-out",
        "hover:bg-cream-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
        "disabled:cursor-not-allowed disabled:border-hairline disabled:text-ash",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
