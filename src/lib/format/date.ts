const ISTANBUL = "Europe/Istanbul";

const dayMonthYear = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ISTANBUL,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dayMonth = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ISTANBUL,
  day: "numeric",
  month: "short",
});

const timeHm = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ISTANBUL,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatIstanbulDate(date: Date): string {
  return dayMonthYear.format(date);
}

export function istanbulYear(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ISTANBUL,
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  return year ? Number(year) : date.getFullYear();
}

function istanbulYmd(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function formatIstanbulTime(date: Date): string {
  // Force HH:mm (tr-TR can use HH.mm)
  return timeHm.format(date).replace(".", ":");
}

/** e.g. "Bugün 10.28'de atandı" / "Dün 09.15'de atandı" / "16 Kas 10.28'de atandı" */
export function formatAssignedAtLabel(iso: string, now: Date): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;

  const atDay = istanbulYmd(at);
  const today = istanbulYmd(now);
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterday = istanbulYmd(yesterdayDate);
  const time = formatIstanbulTime(at);

  if (atDay === today) return `Bugün ${time}'de atandı`;
  if (atDay === yesterday) return `Dün ${time}'de atandı`;
  return `${dayMonth.format(at)} ${time}'de atandı`;
}

/** Short range for past assignments: "Bugün 10.28 → 11.05" or "16 Kas 10.28 → 17 Kas 09.00" */
export function formatAssignmentRangeLabel(
  assignedAt: string,
  unassignedAt: string,
  now: Date,
): string {
  const start = new Date(assignedAt);
  const end = new Date(unassignedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${assignedAt} → ${unassignedAt}`;
  }

  const startDay = istanbulYmd(start);
  const endDay = istanbulYmd(end);
  const today = istanbulYmd(now);
  const startTime = formatIstanbulTime(start);
  const endTime = formatIstanbulTime(end);

  const startLabel =
    startDay === today
      ? `Bugün ${startTime}`
      : `${dayMonth.format(start)} ${startTime}`;
  const endLabel =
    endDay === startDay ? endTime : `${dayMonth.format(end)} ${endTime}`;

  return `${startLabel} → ${endLabel}`;
}
