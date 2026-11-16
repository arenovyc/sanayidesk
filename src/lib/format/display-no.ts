/** Format Istanbul year + counter as YYYY-#### */
export function formatDisplayNo(year: number, counter: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("invalid_year");
  }
  if (!Number.isInteger(counter) || counter < 1) {
    throw new Error("invalid_counter");
  }
  return `${year}-${String(counter).padStart(4, "0")}`;
}

export function isValidDisplayNo(value: string): boolean {
  return /^\d{4}-\d{4}$/.test(value);
}
