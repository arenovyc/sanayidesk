/** Relative wait label from opened_at (ISO) for board cards. */
export function waitLabel(
  openedAtIso: string,
  nowMs: number = Date.now(),
): string {
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

export function truncateComplaint(text: string, max = 60): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
