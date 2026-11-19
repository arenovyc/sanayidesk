import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { surfaceCardInteractive } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { workOrderLabel } from "@/lib/work-orders/display";
import type { WorkOrderRow } from "@/lib/work-orders/types";

export type JobRowJob = Pick<WorkOrderRow, "id" | "status" | "plate"> &
  Partial<
    Pick<WorkOrderRow, "counterTitle" | "displayNo" | "makeModel" | "customerName">
  >;

export function JobRow({
  job,
  tradeKind,
  href,
  subtitle,
  from,
}: {
  job: JobRowJob;
  tradeKind?: string | null;
  href?: string;
  subtitle?: string;
  from?: string;
}) {
  const isCounter = Boolean(job.counterTitle?.trim()) || !job.plate;
  const label = workOrderLabel({
    plate: job.plate,
    counterTitle: job.counterTitle ?? null,
  });
  const extra = subtitle ?? job.makeModel ?? job.customerName ?? undefined;
  const target =
    href ??
    `/jobs/${job.id}${from ? `?from=${encodeURIComponent(from)}` : ""}`;

  return (
    <Link
      href={target}
      prefetch
      className={cn(
        "flex min-h-14 items-center justify-between gap-3 px-4 py-3",
        surfaceCardInteractive,
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {!isCounter ? <LicensePlateBadge plate={job.plate} size="sm" /> : null}
        <span className="flex min-w-0 flex-col">
          {isCounter ? (
            <span className="truncate text-base font-medium tracking-tight text-neutral-950">
              {label}
            </span>
          ) : null}
          {job.displayNo ? (
            <span className="font-mono text-xs tabular-nums text-neutral-400">
              {job.displayNo}
            </span>
          ) : null}
          {extra ? (
            <span className="truncate text-xs text-neutral-500">{extra}</span>
          ) : null}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <StatusBadge status={job.status} tradeKind={tradeKind} />
        <ChevronRight className="size-4 text-neutral-300" aria-hidden />
      </span>
    </Link>
  );
}
