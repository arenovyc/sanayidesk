import type { WorkOrderRow } from "@/lib/work-orders/types";

/** Plaka veya tezgâh başlığı — listelerde tek satır etiket */
export function workOrderLabel(
  job: Pick<WorkOrderRow, "plate" | "counterTitle">,
): string {
  const title = job.counterTitle?.trim();
  if (title) return title;
  return job.plate || "—";
}
