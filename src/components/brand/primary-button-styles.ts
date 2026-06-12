import { cn } from "@/lib/cn";

// Airbnb primary CTA: Rausch fill, white label, modest weight, 8px radius.
export const primaryButtonClassName = cn(
  "inline-flex w-full items-center justify-center rounded-sm bg-terracotta px-6 py-3.5 font-sans text-base font-medium text-white transition-colors duration-200 ease-out",
  "hover:bg-terracotta-deep active:bg-terracotta-deep",
  "disabled:cursor-not-allowed disabled:bg-honey disabled:text-white",
);
