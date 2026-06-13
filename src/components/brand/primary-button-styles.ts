import { cn } from "@/lib/cn";

// Nintendo "forward" CTA: Signal Orange beveled chip, white uppercase label,
// hard bottom shadow line (raised-button bevel), 2px corners.
export const primaryButtonClassName = cn(
  "inline-flex w-full items-center justify-center rounded-xs border-t border-white/40 border-b-2 border-b-[#b4630a] bg-terracotta px-6 py-3 font-sans text-xs font-bold uppercase tracking-[0.5px] text-white transition-colors duration-100 ease-out",
  "hover:bg-terracotta-deep active:translate-y-px active:border-b active:bg-terracotta-deep",
  "disabled:cursor-not-allowed disabled:border-b-chrome-indigo disabled:bg-muted-indigo disabled:text-ash",
);
