/**
 * Seed / canlı demo dükkanları (register_shop ile gelen müşteriler değil).
 * Migration yok — slug listesi + smoke-* öneki.
 */
const KNOWN_DEMO_SLUGS = new Set([
  "baskent-oto",
  "ostim-yildiz-oto",
  "sasmaz-teknik",
  "smoke-a",
  "smoke-b",
]);

export type WorkspaceAudience = "customer" | "demo";

export function workspaceAudience(slug: string): WorkspaceAudience {
  const key = slug.trim().toLowerCase();
  if (KNOWN_DEMO_SLUGS.has(key) || key.startsWith("smoke-")) return "demo";
  return "customer";
}

export function isSeedDemoWorkspace(slug: string): boolean {
  return workspaceAudience(slug) === "demo";
}
