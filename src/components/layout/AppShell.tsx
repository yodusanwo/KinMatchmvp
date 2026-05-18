import { cn } from "@/lib/cn";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** Mobile-first phone-width container. */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-cream-deep">
      <div className={cn("mx-auto min-h-screen max-w-[480px] bg-cream", className)}>
        {children}
      </div>
    </div>
  );
}
