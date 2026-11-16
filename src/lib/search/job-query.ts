import { normalizePlate } from "@/lib/format/plate";

export type JobQueryKind = "empty" | "display_no" | "plate";

export type ParsedJobQuery = {
  kind: JobQueryKind;
  raw: string;
  normalized: string;
};

/** Detect display_no (YYYY-####) vs plate search. */
export function parseJobQuery(raw: string): ParsedJobQuery {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { kind: "empty", raw: trimmed, normalized: "" };
  }

  const display = trimmed.match(/^(\d{4})-(\d{1,6})$/);
  if (display) {
    const year = display[1];
    const seq = display[2].padStart(4, "0");
    return {
      kind: "display_no",
      raw: trimmed,
      normalized: `${year}-${seq}`,
    };
  }

  const plate = normalizePlate(trimmed);
  if (!plate) {
    return { kind: "empty", raw: trimmed, normalized: "" };
  }
  return { kind: "plate", raw: trimmed, normalized: plate };
}

export function matchesJobQuery(
  query: ParsedJobQuery,
  job: { plate: string; displayNo: string | null },
): boolean {
  if (query.kind === "empty") return true;
  if (query.kind === "display_no") {
    return (job.displayNo ?? "").toUpperCase() === query.normalized.toUpperCase();
  }
  return normalizePlate(job.plate).includes(query.normalized);
}
