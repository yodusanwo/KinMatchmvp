import { cn } from "@/lib/cn";

type BrandMarkProps = {
  size?: number;
  className?: string;
};

/** Overlap mark: forest + terracotta circles with a mustard intersection. */
export function BrandMark({ size = 28, className }: BrandMarkProps) {
  const clipId = `brandmark-intersect-${size}`;

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
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="16" r="10" />
        </clipPath>
      </defs>
      <circle cx="12" cy="16" r="10" className="fill-forest" />
      <circle cx="20" cy="16" r="10" className="fill-terracotta" />
      <circle
        cx="20"
        cy="16"
        r="10"
        className="fill-mustard"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
