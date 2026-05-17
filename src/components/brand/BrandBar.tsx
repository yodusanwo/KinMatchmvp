import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/cn";

type BrandBarProps = {
  className?: string;
};

export function BrandBar({ className }: BrandBarProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-2 border-b border-ink/[0.12] px-5 py-4",
        className
      )}
    >
      <BrandMark size={24} />
      <span className="font-inter text-lg italic text-ink">KinMatch</span>
    </header>
  );
}
