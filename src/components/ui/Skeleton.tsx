import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-xl bg-cream-deep", className)}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function TodayPageSkeleton() {
  return (
    <div className="mt-8 space-y-8" aria-label="Loading" aria-busy>
      <div className="rounded-2xl border border-ink/[0.12] bg-cream-deep/40 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="mt-4 h-12 w-full" />
        <Skeleton className="mt-4 h-10 w-full rounded-sm" />
      </div>
      <div>
        <Skeleton className="mb-4 h-3 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-8 pt-6" aria-label="Loading" aria-busy>
      <div className="flex flex-col items-center">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="mt-4 h-6 w-36" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <SkeletonText lines={4} />
    </div>
  );
}

export function HeldPageSkeleton() {
  return (
    <div className="mt-10 space-y-8" aria-label="Loading" aria-busy>
      <Skeleton className="h-3 w-28" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VoiceNotePageSkeleton() {
  return (
    <div className="space-y-8 pt-8" aria-label="Loading" aria-busy>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <Skeleton className="mx-auto h-32 w-full max-w-sm" />
      <Skeleton className="mx-auto h-16 w-16 rounded-full" />
    </div>
  );
}

export function ListenPageSkeleton() {
  return (
    <div className="mt-10 space-y-8" aria-label="Loading" aria-busy>
      <div className="flex flex-col items-center">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="mt-4 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}
