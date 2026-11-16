import type { MembershipRole } from "@/lib/auth/roles";
import {
  isOpenStatus,
  OPEN_STATUSES,
  type OpenWorkOrderStatus,
  type WorkOrderStatus,
} from "@/lib/work-orders/status";

export const BOARD_STATUSES = OPEN_STATUSES;
export type BoardStatus = OpenWorkOrderStatus;

export function canAssignRole(role: MembershipRole): boolean {
  return role === "mechanic";
}

export function isBoardStatus(status: WorkOrderStatus): status is BoardStatus {
  return isOpenStatus(status);
}

export function boardColumnForStatus(
  status: WorkOrderStatus,
): BoardStatus | null {
  return isBoardStatus(status) ? status : null;
}

/** Active assignment: unassigned_at null. */
export function isActiveAssignment(row: {
  unassignedAt?: string | null;
}): boolean {
  return !row.unassignedAt;
}
