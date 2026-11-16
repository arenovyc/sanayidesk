const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `numeric(12,2)` TRY. Do not use float arithmetic at the call site. */
export function formatMoney(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return money.format(0);
  return money.format(value);
}
