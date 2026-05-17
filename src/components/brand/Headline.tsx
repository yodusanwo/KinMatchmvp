import { cn } from "@/lib/cn";

type HeadlineProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** 22px medium — Instrument Sans. */
export function Headline({ children, as: Tag = "h1", className }: HeadlineProps) {
  return (
    <Tag
      className={cn(
        "font-sans text-[22px] font-medium leading-snug text-ink",
        className
      )}
    >
      {children}
    </Tag>
  );
}
