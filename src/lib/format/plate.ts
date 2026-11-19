const TR_LETTER_UPPER: Record<string, string> = {
  a: "A",
  b: "B",
  c: "C",
  ç: "C",
  d: "D",
  e: "E",
  f: "F",
  g: "G",
  ğ: "G",
  h: "H",
  ı: "I",
  i: "I",
  j: "J",
  k: "K",
  l: "L",
  m: "M",
  n: "N",
  o: "O",
  ö: "O",
  p: "P",
  q: "Q",
  r: "R",
  s: "S",
  ş: "S",
  t: "T",
  u: "U",
  ü: "U",
  v: "V",
  w: "W",
  x: "X",
  y: "Y",
  z: "Z",
};

/** Workspace-unique key. `06 ABC 123` and `06-abc-123` become `06ABC123`. Never uses tr-TR uppercasing (i → İ). */
export function normalizePlate(raw: string): string {
  return Array.from(raw.trim().replace(/[\s.\-_]/g, ""), (char) => {
    const mapped = TR_LETTER_UPPER[char];
    if (mapped) return mapped;
    if (char >= "A" && char <= "Z") return char;
    if (char >= "0" && char <= "9") return char;
    return char.toLocaleUpperCase("en-US");
  }).join("");
}

/**
 * Human-readable TR plate: city + letters + numbers with spaces.
 * `06KMK7890` → `06 KMK 7890`. Falls back to normalized string.
 */
const TR_PLATE_RE = /^(\d{2})([A-Z]{1,3})(\d{2,5})$/;

export type ParsedTrPlate =
  | { official: true; city: string; letters: string; numbers: string; formatted: string }
  | { official: false; formatted: string };

export function parseTrPlate(raw: string): ParsedTrPlate {
  const key = normalizePlate(raw);
  const match = key.match(TR_PLATE_RE);
  if (!match) return { official: false, formatted: key };
  return {
    official: true,
    city: match[1],
    letters: match[2],
    numbers: match[3],
    formatted: `${match[1]} ${match[2]} ${match[3]}`,
  };
}

export function displayPlate(raw: string): string {
  return parseTrPlate(raw).formatted;
}
