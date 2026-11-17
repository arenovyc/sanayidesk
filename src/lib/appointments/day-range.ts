/** Istanbul calendar day bounds as ISO UTC strings for timestamptz filters. */
export function istanbulDayBoundsIso(now: Date): {
  startIso: string;
  endIso: string;
} {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const ymd = fmt.format(now); // YYYY-MM-DD
  // Approximate: Istanbul is UTC+3 (no DST since 2016)
  const start = new Date(`${ymd}T00:00:00+03:00`);
  const end = new Date(`${ymd}T24:00:00+03:00`);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function formatAppointmentTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
