import type { WorkOrderStatus } from "@/lib/work-orders/status";

export type StatusTone = {
  badge: string;
  bar: string;
};

export const STATUS_TONE: Record<WorkOrderStatus, StatusTone> = {
  intake: {
    badge: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-600/15",
    bar: "bg-neutral-400",
  },
  waiting_approval: {
    badge: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
    bar: "bg-amber-500",
  },
  in_progress: {
    badge: "bg-sky-50 text-sky-800 ring-1 ring-sky-600/20",
    bar: "bg-sky-500",
  },
  waiting_parts: {
    badge: "bg-orange-50 text-orange-800 ring-1 ring-orange-600/20",
    bar: "bg-orange-500",
  },
  ready: {
    badge: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20",
    bar: "bg-emerald-500",
  },
  delivered: {
    badge: "bg-emerald-50/80 text-emerald-700 ring-1 ring-emerald-600/10",
    bar: "bg-emerald-300",
  },
  cancelled: {
    badge: "bg-red-50 text-red-700 ring-1 ring-red-600/15",
    bar: "bg-red-400",
  },
};

export function statusTone(status: WorkOrderStatus): StatusTone {
  return STATUS_TONE[status];
}
