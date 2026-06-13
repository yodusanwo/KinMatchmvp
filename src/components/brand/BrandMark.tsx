import { cn } from "@/lib/cn";

type BrandMarkProps = {
  size?: number;
  className?: string;
};

/** Two overlapping head-and-shoulder figures — sky-blue + orange — for connection. */
export function BrandMark({ size = 28, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle cx="12" cy="11" r="4" fill="#9fbee7" />
      <path d="M6 19c0-2.2 2.7-4 6-4s6 1.8 6 4v7H6v-7z" fill="#9fbee7" />
      <circle cx="20" cy="11" r="4" fill="#f68d1f" />
      <path d="M14 19c0-2.2 2.7-4 6-4s6 1.8 6 4v7h-12v-7z" fill="#f68d1f" />
    </svg>
  );
}
