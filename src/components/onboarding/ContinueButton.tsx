import Link from "next/link";
import { cn } from "@/lib/cn";

const inkClassName = cn(
  "inline-flex w-full items-center justify-center rounded-xs border-t border-white/40 border-b-2 border-b-[#b4630a] bg-terracotta px-6 py-3 font-sans text-xs font-bold uppercase tracking-[0.5px] text-white transition-colors duration-100 ease-out",
  "hover:bg-terracotta-deep active:translate-y-px active:border-b",
  "disabled:cursor-not-allowed disabled:border-b-chrome-indigo disabled:bg-muted-indigo disabled:text-ash"
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
