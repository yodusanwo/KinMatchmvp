import { cn } from "@/lib/cn";

type HeadlineProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Heavy display heading — uppercase, ink, tight line-height. */
export function Headline({ children, as: Tag = "h1", className }: HeadlineProps) {
  return (
    <Tag
      className={cn(
        "font-display text-[26px] uppercase leading-[1.04] tracking-[0.01em] text-ink",
        className
      )}
    >
      {children}
    </Tag>
  );
}
