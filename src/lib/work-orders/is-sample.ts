import type { WorkOrderStatus } from "@/lib/work-orders/status";
import { isOpenStatus } from "@/lib/work-orders/status";

/** Kayıt sırasında eklenen demo iş emri (soft iptal ile listeden kalkar). */
export function isSampleWorkOrder(input: {
  complaint: string;
  customerName: string | null;
  status: WorkOrderStatus;
}): boolean {
  if (!isOpenStatus(input.status)) return false;
  const name = input.customerName?.trim() ?? "";
  if (name === "Örnek Müşteri") return true;
  const c = input.complaint.trim();
  if (!c) return false;
  const lower = c.toLocaleLowerCase("tr-TR");
  return (
    lower.startsWith("örnek") || lower.includes("inceleyip silebilirsiniz")
  );
}