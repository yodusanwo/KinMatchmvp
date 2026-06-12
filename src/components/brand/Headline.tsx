import { cn } from "@/lib/cn";

type HeadlineProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Modest-weight Cereal-style display headline. */
export function Headline({ children, as: Tag = "h1", className }: HeadlineProps) {
  return (
    <Tag
      className={cn(
        "font-sans text-[24px] font-semibold leading-snug tracking-[-0.01em] text-ink",
        className
      )}
    >
      {children}
    </Tag>
  );
}
