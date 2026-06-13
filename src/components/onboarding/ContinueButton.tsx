import Link from "next/link";
import { cn } from "@/lib/cn";

const inkClassName = cn(
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-sm bg-carbon px-6 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors duration-150 ease-out",
  "hover:bg-ink active:translate-y-px",
  "disabled:cursor-not-allowed disabled:bg-stone disabled:text-cream"
);

type ContinueButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "ink" | "terracotta";
  className?: string;
};

const terracottaClassName = inkClassName;

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
