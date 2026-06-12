import Link from "next/link";
import { cn } from "@/lib/cn";

const inkClassName = cn(
  "inline-flex w-full items-center justify-center rounded-full bg-ink px-8 py-3.5 font-sans text-base font-medium text-white transition-transform duration-150 ease-out",
  "hover:bg-terracotta-deep active:scale-[0.98]",
  "disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-stone"
);

type ContinueButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "ink" | "terracotta";
  className?: string;
};

const terracottaClassName = cn(
  "inline-flex w-full items-center justify-center rounded-full bg-ink px-8 py-3.5 font-sans text-base font-medium text-white transition-transform duration-150 ease-out",
  "hover:bg-terracotta-deep active:scale-[0.98]",
  "disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-stone"
);

export function ContinueButton({
  children,
  href,
  onClick,
  disabled,
  variant = "ink",
  className,
}: ContinueButtonProps) {
  const styles = cn(
    variant === "terracotta" ? terracottaClassName : inkClassName,
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles}
    >
      {children}
    </button>
  );
}
