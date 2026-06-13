import { cn } from "@/lib/cn";

type HeadlineProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Heavy uppercase chrome title — Arial-bold console legend voice. */
export function Headline({ children, as: Tag = "h1", className }: HeadlineProps) {
  return (
    <Tag
      className={cn(
        "font-sans text-[22px] font-black uppercase leading-none tracking-[0.5px] text-ink",
        className
      )}
    >
      {children}
    </Tag>
  );
}
