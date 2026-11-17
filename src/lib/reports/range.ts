/** Istanbul calendar YYYY-MM-DD helpers for reports. */

export function istanbulTodayYmd(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function istanbulMonthStartYmd(todayYmd: string): string {
  return `${todayYmd.slice(0, 7)}-01`;
}

export function rangeToInclusiveEndIso(toYmd: string): string {
  return `${toYmd}T23:59:59.999+03:00`;
}

export function rangeFromStartIso(fromYmd: string): string {
  return `${fromYmd}T00:00:00.000+03:00`;
}
