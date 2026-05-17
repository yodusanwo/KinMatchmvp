import Link from "next/link";
import { cn } from "@/lib/cn";

type TextLinkProps = {
  children: React.ReactNode;
  href: string;
  className?: string;
};

/** Underlined terracotta deferral link. */
export function TextLink({ children, href, className }: TextLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 transition-colors duration-250 ease-out hover:text-terracotta-deep hover:decoration-terracotta-deep",
        className
      )}
    >
      {children}
    </Link>
  );
}
