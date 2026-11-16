/** net = we_owe − they_owe (confirmed totals). Positive ⇒ we owe. */
export function netBalance(weOweTotal: number, theyOweTotal: number): number {
  return Math.round((weOweTotal - theyOweTotal) * 100) / 100;
}

export function netBalanceLabel(net: number): string {
  if (net > 0) return "Biz borçluyuz (net)";
  if (net < 0) return "Onlar borçlu (net)";
  return "Bakiye sıfır";
}
