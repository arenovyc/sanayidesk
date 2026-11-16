export function remainingDue(due: number, paid: number): number {
  const left = Math.round((due - paid) * 100) / 100;
  return left > 0 ? left : 0;
}

export function canAcceptPayment(due: number, paid: number, amount: number): boolean {
  if (!(amount > 0)) return false;
  if (!(due > 0)) return false;
  return paid + amount <= due + 1e-9;
}

/** Active (non-voided) payments — for list filters and paid totals. */
export function isActivePayment(payment: {
  voidedAt?: string | null;
}): boolean {
  return !payment.voidedAt;
}

/** Non-credit payments that are not voided count toward paid. */
export function sumPaidAmount(
  payments: { amount: number; method: string; voidedAt?: string | null }[],
): number {
  return payments
    .filter(
      (payment) => payment.method !== "credit" && isActivePayment(payment),
    )
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function paidAfterVoid(
  due: number,
  paidBefore: number,
  voidAmount: number,
  method: string,
): { paid: number; remaining: number } {
  const paid =
    method === "credit"
      ? paidBefore
      : Math.round((paidBefore - voidAmount) * 100) / 100;
  const safePaid = paid > 0 ? paid : 0;
  return { paid: safePaid, remaining: remainingDue(due, safePaid) };
}
