import {
  canTransition,
  isOpenStatus,
  isWorkOrderStatus,
  type OpenWorkOrderStatus,
  type WorkOrderStatus,
} from "@/lib/work-orders/status";

/** Map board drop target to a valid status transition, or null. */
export function statusForBoardDrop(
  from: WorkOrderStatus,
  toColumn: string,
): OpenWorkOrderStatus | null {
  if (!isOpenStatus(from)) return null;
  if (!isWorkOrderStatus(toColumn) || !isOpenStatus(toColumn)) return null;
  if (from === toColumn) return null;
  if (!canTransition(from, toColumn)) return null;
  return toColumn;
}
