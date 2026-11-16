const ISTANBUL = "Europe/Istanbul";

const dayMonthYear = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ISTANBUL,
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatIstanbulDate(date: Date = new Date()): string {
  return dayMonthYear.format(date);
}

export function istanbulYear(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ISTANBUL,
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  return year ? Number(year) : date.getFullYear();
}
