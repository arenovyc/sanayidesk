import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-neutral-200/70",
        className,
      )}
      aria-hidden
    />
  );
}

/** Full placeholder — prefer RouteLoading for tab switches. */
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

/** Light, short flash for soft navigations. */
export function RouteLoading() {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-label="Yükleniyor"
    >
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-4 w-52" />
      <Skeleton className="mt-1 h-36 w-full rounded-2xl" />
    </div>
  );
}
