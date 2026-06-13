import { cn } from "@/lib/cn";

type HeadlineProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Chunky box-art title — Archivo Black, the console logotype voice. */
export function Headline({ children, as: Tag = "h1", className }: HeadlineProps) {
  return (
    <Tag
      className={cn(
        "font-display text-[24px] uppercase leading-[1.05] tracking-[0.5px] text-ink",
        className
      )}
    >
      {children}
    </Tag>
  );
}
