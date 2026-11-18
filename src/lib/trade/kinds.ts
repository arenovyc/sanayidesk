export const TRADE_KINDS = [
  "tamir",
  "kaporta",
  "elektrik",
  "lastik",
  "parca",
  "torna",
] as const;

export type TradeKind = (typeof TRADE_KINDS)[number];

export const TRADE_KIND_LABELS: Record<TradeKind, string> = {
  tamir: "Tamir & Mekanik",
  kaporta: "Kaporta & Boya",
  elektrik: "Oto Elektrik & Klima",
  lastik: "Lastik & Rot",
  parca: "Yedek Parça",
  torna: "Torna & Rektifiye",
};

export function isTradeKind(value: string): value is TradeKind {
  return (TRADE_KINDS as readonly string[]).includes(value);
}

/** Tezgâh / tedarik — örnek iş emri yok, stok örnekleri var */
export function isCounterTrade(kind: TradeKind): boolean {
  return kind === "parca" || kind === "torna";
}

export function tradeKindLabel(kind: string | null | undefined): string {
  if (kind && isTradeKind(kind)) return TRADE_KIND_LABELS[kind];
  return TRADE_KIND_LABELS.tamir;
}
