export const WORK_ORDER_STATUSES = [
  "intake",
  "waiting_approval",
  "in_progress",
  "waiting_parts",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const OPEN_STATUSES = [
  "intake",
  "waiting_approval",
  "in_progress",
  "waiting_parts",
  "ready",
] as const;
export type OpenWorkOrderStatus = (typeof OPEN_STATUSES)[number];

export const TODAY_BUCKETS = ["inside", "parts", "ready"] as const;
export type TodayBucket = (typeof TODAY_BUCKETS)[number];

const OPEN_SET = new Set<string>(OPEN_STATUSES);

export function isWorkOrderStatus(value: string): value is WorkOrderStatus {
  return (WORK_ORDER_STATUSES as readonly string[]).includes(value);
}

export function isOpenStatus(status: WorkOrderStatus): status is OpenWorkOrderStatus {
  return OPEN_SET.has(status);
}

export function bucketForStatus(status: WorkOrderStatus): TodayBucket | null {
  if (
    status === "intake" ||
    status === "waiting_approval" ||
    status === "in_progress"
  ) {
    return "inside";
  }
  if (status === "waiting_parts") return "parts";
  if (status === "ready") return "ready";
  return null;
}

export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  if (from === to) return false;
  if (from === "delivered" || from === "cancelled") return false;
  if (OPEN_SET.has(from) && OPEN_SET.has(to)) return true;
  if (to === "cancelled" && OPEN_SET.has(from)) return true;
  if (from === "ready" && to === "delivered") return true;
  return false;
}

export function allowedTransitions(from: WorkOrderStatus): WorkOrderStatus[] {
  return WORK_ORDER_STATUSES.filter((to) => canTransition(from, to));
}

/** Usta: teslim/iptal yok; yalnız açık durumlar arası. */
export function staffCanTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  if (!isOpenStatus(from) || !isOpenStatus(to)) return false;
  return canTransition(from, to);
}

export function staffAllowedTransitions(from: WorkOrderStatus): WorkOrderStatus[] {
  return OPEN_STATUSES.filter((to) => staffCanTransition(from, to));
}

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  intake: "Kabul",
  waiting_approval: "Onay Bekliyor",
  in_progress: "İçeride",
  waiting_parts: "Parça",
  ready: "Hazır",
  delivered: "Teslim",
  cancelled: "İptal",
};

export const BUCKET_LABELS: Record<TodayBucket, string> = {
  inside: "İçeride",
  parts: "Parça",
  ready: "Hazır",
};
