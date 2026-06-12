import { cn } from "@/lib/cn";
import { primaryButtonClassName } from "./primary-button-styles";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

/** Solid black Nike pill — the universal primary CTA. */
export function PrimaryButton({
  children,
  className,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(primaryButtonClassName, className)}
      {...props}
    >
      {children}
    </button>
  );
}
