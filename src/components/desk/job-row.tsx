import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { workOrderLabel } from "@/lib/work-orders/display";
import { STATUS_LABELS } from "@/lib/work-orders/status";
import type { WorkOrderRow } from "@/lib/work-orders/types";

export function JobRow({ job }: { job: WorkOrderRow }) {
  const label = workOrderLabel(job);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
    >
      <span className="flex min-w-0 flex-col">
        <span
          className={
            job.counterTitle
              ? "truncate text-base font-medium tracking-normal"
              : "font-mono text-base tracking-wide"
          }
        >
          {label}
        </span>
        {job.displayNo ? (
          <span className="font-mono text-xs text-neutral-400">
            {job.displayNo}
          </span>
        ) : null}
        {job.makeModel ? (
          <span className="mt-0.5 truncate text-xs text-neutral-500">
            {job.makeModel}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
          {STATUS_LABELS[job.status]}
        </span>
        <ChevronRight className="size-4 text-neutral-300" aria-hidden />
      </span>
    </Link>
  );
}
