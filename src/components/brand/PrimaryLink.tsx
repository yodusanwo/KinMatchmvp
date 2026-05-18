import Link from "next/link";
import { cn } from "@/lib/cn";
import { primaryButtonClassName } from "./primary-button-styles";

type PrimaryLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function PrimaryLink({ href, children, className }: PrimaryLinkProps) {
  return (
    <Link href={href} className={cn(primaryButtonClassName, className)}>
      {children}
    </Link>
  );
}
