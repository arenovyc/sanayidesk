import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-neutral-200/80",
        className,
      )}
      aria-hidden
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Yükleniyor">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-2 h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
