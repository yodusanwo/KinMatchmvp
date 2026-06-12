import { cn } from "@/lib/cn";

// Nike primary CTA: solid black pill, white label, medium weight.
export const primaryButtonClassName = cn(
  "inline-flex w-full items-center justify-center rounded-full bg-ink px-8 py-3.5 font-sans text-base font-medium text-white transition-transform duration-150 ease-out",
  "hover:bg-terracotta-deep active:scale-[0.98]",
  "disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-stone",
);
