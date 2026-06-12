import { cn } from "@/lib/cn";

type HeadlineProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Helvetica-Now-style section heading — medium weight, tight leading. */
export function Headline({ children, as: Tag = "h1", className }: HeadlineProps) {
  return (
    <Tag
      className={cn(
        "font-sans text-[24px] font-medium leading-[1.2] text-ink",
        className
      )}
    >
      {children}
    </Tag>
  );
}
