import Link from "next/link";
import { cn } from "@/lib/cn";

const inkClassName = cn(
  "inline-flex w-full items-center justify-center rounded-sm bg-terracotta px-6 py-3 font-sans text-sm font-bold text-black transition-colors duration-150 ease-out",
  "hover:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
  "disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-ash"
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
  "inline-flex w-full items-center justify-center rounded-sm bg-terracotta px-6 py-3 font-sans text-sm font-bold text-black transition-colors duration-150 ease-out",
  "hover:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
  "disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-ash"
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
