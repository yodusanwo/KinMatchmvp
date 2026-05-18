"use client";

import { BrandBar } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressDots } from "./ProgressDots";
import { cn } from "@/lib/cn";

const STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: "Step 1 of 3",
  2: "Step 2 of 3",
  3: "Step 3 of 3",
};

type ReflectionStepShellProps = {
  step: 1 | 2 | 3;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function ReflectionStepShell({
  step,
  children,
  footer,
  className,
}: ReflectionStepShellProps) {
  return (
    <AppShell>
      <BrandBar />
      <div className={cn("flex min-h-[calc(100vh-65px)] flex-col px-5 py-6", className)}>
        <div className="mb-8 space-y-2">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-terracotta">
            {STEP_LABELS[step]}
          </p>
          <ProgressDots filled={step} total={3} />
        </div>
        <div className="flex-1 space-y-6">{children}</div>
        {footer && <div className="mt-8 space-y-4 pb-4">{footer}</div>}
      </div>
    </AppShell>
  );
}
