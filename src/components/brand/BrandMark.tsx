import { cn } from "@/lib/cn";

type BrandMarkProps = {
  size?: number;
  className?: string;
};

/** Two intertwined head and shoulder silhouettes representing connection (dark mode knockout). */
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
          {/* Left silhouette clip path */}
          <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4zm-2 8c0-2.2 2.7-4 6-4s6 1.8 6 4v6H6v-6z" />
        </clipPath>
      </defs>
      
      {/* Left silhouette (light sage) */}
      <g>
        <circle cx="12" cy="12" r="4" className="fill-[#b5c5b5]" />
        <path
          d="M6 20c0-2.2 2.7-4 6-4s6 1.8 6 4v6H6v-6z"
          className="fill-[#b5c5b5]"
        />
      </g>
      
      {/* Right silhouette (terracotta) */}
      <g>
        <circle cx="20" cy="12" r="4" className="fill-terracotta" />
        <path
          d="M14 20c0-2.2 2.7-4 6-4s6 1.8 6 4v6h-12v-6z"
          className="fill-terracotta"
        />
      </g>
      
      {/* Overlap/intersection (mustard) */}
      <g clipPath={`url(#${clipId})`}>
        <circle cx="20" cy="12" r="4" className="fill-mustard" />
        <path
          d="M14 20c0-2.2 2.7-4 6-4s6 1.8 6 4v6h-12v-6z"
          className="fill-mustard"
        />
      </g>
    </svg>
  );
}
