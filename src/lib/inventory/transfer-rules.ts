export function canRequestTransfer(
  qty: number,
  availableQty: number,
  fromWorkspaceId: string,
  toWorkspaceId: string,
): { ok: true } | { ok: false; reason: string } {
  if (fromWorkspaceId === toWorkspaceId) {
    return { ok: false, reason: "Aynı dükkana transfer olmaz" };
  }
  if (!(qty > 0)) {
    return { ok: false, reason: "Miktar geçersiz" };
  }
  if (qty > availableQty) {
    return { ok: false, reason: "Yetersiz stok" };
  }
  return { ok: true };
}

export function transferStatusLabel(
  status: "pending" | "approved" | "rejected" | "cancelled",
): string {
  switch (status) {
    case "pending":
      return "Bekliyor";
    case "approved":
      return "Onaylı";
    case "rejected":
      return "Red";
    case "cancelled":
      return "İptal";
  }
}
