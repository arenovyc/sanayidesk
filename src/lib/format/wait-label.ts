/** Relative wait label from opened_at (ISO) for board cards. */
export function waitLabel(openedAtIso: string, nowMs: number): string {
  const opened = Date.parse(openedAtIso);
  if (Number.isNaN(opened)) return "";
  const minutes = Math.max(0, Math.floor((nowMs - opened) / 60_000));
  if (minutes < 5) return "Az önce";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} saattir bekliyor`;
  const days = Math.floor(hours / 24);
  return `${days} gündür bekliyor`;
}

/** Compact wait chip for board card headers: `40dk`, `2s`, `5g`. */
export function waitBadgeLabel(openedAtIso: string, nowMs: number): string {
  const opened = Date.parse(openedAtIso);
  if (Number.isNaN(opened)) return "";
  const minutes = Math.max(0, Math.floor((nowMs - opened) / 60_000));
  if (minutes < 5) return "yeni";
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}s`;
  return `${Math.floor(hours / 24)}g`;
}

/** `2026-0031` → `#0031` for dense board cards. */
export function shortDisplayNo(displayNo: string | null | undefined): string | null {
  if (!displayNo?.trim()) return null;
  const tail = displayNo.trim().split("-").pop();
  return tail ? `#${tail}` : displayNo.trim();
}

export function truncateComplaint(text: string, max = 60): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
