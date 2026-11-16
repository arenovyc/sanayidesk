export function isLowStock(qty: number, minQty: number): boolean {
  return qty <= minQty;
}

export function movementDelta(
  kind: "in" | "out" | "adjust",
  qty: number,
  currentQty: number,
): number {
  if (kind === "in") return qty;
  if (kind === "out") return -qty;
  return qty - currentQty;
}
