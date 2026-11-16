export type B2bEntryStatus = "pending" | "confirmed" | "rejected";

export function canConfirmB2b(status: B2bEntryStatus): boolean {
  return status === "pending";
}

export function canRejectB2b(status: B2bEntryStatus): boolean {
  return status === "pending";
}

export function nextB2bStatus(
  status: B2bEntryStatus,
  action: "confirm" | "reject",
): B2bEntryStatus | null {
  if (status !== "pending") return null;
  return action === "confirm" ? "confirmed" : "rejected";
}
