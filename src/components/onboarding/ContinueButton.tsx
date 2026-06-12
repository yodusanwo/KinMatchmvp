import Link from "next/link";
import { cn } from "@/lib/cn";

const inkClassName = cn(
  "inline-flex w-full items-center justify-center rounded-sm bg-ink px-6 py-3.5 font-sans text-base font-medium text-white transition-colors duration-200 ease-out",
  "hover:bg-body",
  "disabled:cursor-not-allowed disabled:bg-hairline disabled:text-stone"
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
  "inline-flex w-full items-center justify-center rounded-sm bg-terracotta px-6 py-3.5 font-sans text-base font-medium text-white transition-colors duration-200 ease-out",
  "hover:bg-terracotta-deep",
  "disabled:cursor-not-allowed disabled:bg-honey disabled:text-white"
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
