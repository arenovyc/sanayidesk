export function isValidBonusAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}

export function totalBonusAmount(
  rows: { amount: number }[],
): number {
  return Math.round(rows.reduce((sum, row) => sum + row.amount, 0) * 100) / 100;
}
