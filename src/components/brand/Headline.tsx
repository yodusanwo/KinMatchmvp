import { cn } from "@/lib/cn";

type HeadlineProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Bold sans headline — hierarchy comes from weight, not color. */
export function Headline({ children, as: Tag = "h1", className }: HeadlineProps) {
  return (
    <Tag
      className={cn(
        "font-sans text-[24px] font-bold leading-tight tracking-tight text-ink",
        className
      )}
    >
      {children}
    </Tag>
  );
}
