import { normalizePlate } from "@/lib/format/plate";

export type JobQueryKind = "empty" | "display_no" | "plate" | "text";

export type ParsedJobQuery = {
  kind: JobQueryKind;
  raw: string;
  normalized: string;
};

/** Detect display_no (YYYY-####), plate, or free text (title/customer). */
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
  // Plate-like: normalized has letters+digits and original isn't clearly a name/phrase
  const looksLikePlate =
    plate.length >= 3 &&
    plate.length <= 12 &&
    /^[A-Z0-9]+$/.test(plate) &&
    /[0-9]/.test(plate) &&
    /[A-Z]/.test(plate) &&
    // Free text with many letters and spaces (e.g. "Ahmet Oto balata") → text
    !(
      /[çğıöşüÇĞİÖŞÜa-zA-Z]{3,}/.test(trimmed) &&
      (trimmed.includes(" ") || trimmed.length > 14) &&
      !/^\d{1,2}\s*[a-zA-Z]{1,3}\s*\d{2,}/.test(trimmed)
    );

  if (looksLikePlate) {
    return { kind: "plate", raw: trimmed, normalized: plate };
  }

  return {
    kind: "text",
    raw: trimmed,
    normalized: trimmed.toLocaleLowerCase("tr-TR"),
  };
}

export function matchesJobQuery(
  query: ParsedJobQuery,
  job: {
    plate: string;
    displayNo: string | null;
    counterTitle?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
  },
): boolean {
  if (query.kind === "empty") return true;
  if (query.kind === "display_no") {
    return (job.displayNo ?? "").toUpperCase() === query.normalized.toUpperCase();
  }
  if (query.kind === "plate") {
    return normalizePlate(job.plate).includes(query.normalized);
  }
  const hay = [
    job.counterTitle ?? "",
    job.customerName ?? "",
    job.customerPhone ?? "",
    job.plate,
    job.displayNo ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase("tr-TR");
  if (hay.includes(query.normalized)) return true;
  const tokens = query.normalized.split(/\s+/).filter((t) => t.length >= 2);
  return tokens.length > 0 && tokens.every((t) => hay.includes(t));
}
