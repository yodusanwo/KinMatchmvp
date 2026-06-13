import { cn } from "@/lib/cn";

// Primary CTA: solid carbon slab, white uppercase label, 4px corners.
export const primaryButtonClassName = cn(
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-sm bg-carbon px-6 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors duration-150 ease-out",
  "hover:bg-ink active:translate-y-px",
  "disabled:cursor-not-allowed disabled:bg-stone disabled:text-cream",
);
