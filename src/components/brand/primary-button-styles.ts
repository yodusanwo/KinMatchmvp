import { cn } from "@/lib/cn";

// NVIDIA primary CTA: solid green fill, black label, 2px corners, no shadow.
export const primaryButtonClassName = cn(
  "inline-flex w-full items-center justify-center rounded-sm bg-terracotta px-6 py-3 font-sans text-sm font-bold text-black transition-colors duration-150 ease-out",
  "hover:bg-terracotta-deep active:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
  "disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-ash",
);
