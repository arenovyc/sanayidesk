const ALLOWED_PREFIXES = [
  "/board",
  "/payments",
  "/today",
  "/lift",
  "/parts",
  "/customers",
  "/vehicles",
  "/neighbors",
  "/inventory",
  "/b2b",
  "/appointments",
];

export function jobReturnFrom(raw: string | undefined | null): {
  href: string;
  label: string;
} {
  const value = (raw ?? "").trim();
  const fallback = { href: "/today", label: "Bugün" };
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }
  const path = value.split("?")[0] ?? value;
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (!allowed) return fallback;
  if (path === "/board" || path.startsWith("/board/")) {
    return { href: value, label: "İşler" };
  }
  if (path === "/payments") return { href: "/payments", label: "Tahsilat" };
  if (path.startsWith("/lift")) return { href: "/lift", label: "Liftim" };
  if (path.startsWith("/customers")) return { href: value, label: "Müşteri" };
  if (path.startsWith("/vehicles")) return { href: value, label: "Araç" };
  if (path === "/neighbors") return { href: "/neighbors", label: "Komşular" };
  if (path === "/inventory") return { href: "/inventory", label: "Stok" };
  if (path.startsWith("/b2b")) return { href: value, label: "Cari" };
  return { href: value, label: "Geri" };
}
