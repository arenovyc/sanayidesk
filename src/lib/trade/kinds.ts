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

export function isCounterTrade(kind: TradeKind): boolean {
  return kind === "parca" || kind === "torna";
}

export function isWorkshopTrade(kind: TradeKind): boolean {
  return !isCounterTrade(kind);
}

export function tradeKindLabel(kind: string | null | undefined): string {
  if (kind && isTradeKind(kind)) return TRADE_KIND_LABELS[kind];
  return TRADE_KIND_LABELS.tamir;
}

export type QuickPreset = { id: string; label: string; text: string };

export const QUICK_PRESETS: Record<TradeKind, QuickPreset[]> = {
  tamir: [
    { id: "bakim", label: "Periyodik bakım", text: "Periyodik bakım" },
    { id: "debriyaj", label: "Debriyaj", text: "Debriyaj seti" },
    { id: "fren", label: "Fren", text: "Fren bakımı" },
    { id: "diag", label: "Diagnostik", text: "Arıza diagnostik" },
    { id: "yag", label: "Yağ+filtre", text: "Yağ + filtre değişimi" },
  ],
  kaporta: [
    { id: "boya", label: "Parça boya", text: "Parça boya" },
    { id: "gocuk", label: "Göçük", text: "Göçük düzeltme" },
    { id: "tampon", label: "Tampon", text: "Tampon onarım / boya" },
    { id: "ekspertiz", label: "Ekspertiz foto", text: "Ekspertiz fotoğraf" },
    { id: "set", label: "Kaporta set", text: "Kaporta set işi" },
  ],
  elektrik: [
    { id: "aku", label: "Akü", text: "Akü kontrol / değişim" },
    { id: "mars", label: "Marş/şarj", text: "Marş / şarj sistemi" },
    { id: "klima", label: "Klima gazı", text: "Klima gaz dolumu" },
    { id: "ariza", label: "Arıza tespit", text: "Elektrik arıza tespiti" },
    { id: "sensor", label: "Sensör", text: "Sensör arızası" },
  ],
  lastik: [
    { id: "4lastik", label: "4 lastik", text: "4 lastik değişim" },
    { id: "rot", label: "Rot-balans", text: "Rot ayar + balans" },
    { id: "otel", label: "Lastik oteli", text: "Lastik oteli" },
    { id: "yamuk", label: "Yamuk", text: "Lastik yamuk / tamir" },
    { id: "tpms", label: "TPMS", text: "Basınç / TPMS" },
  ],
  parca: [
    { id: "bakimset", label: "Bakım seti", text: "Bakım seti" },
    { id: "fren", label: "Fren grubu", text: "Fren grubu" },
    { id: "veresiye", label: "Veresiye çıkış", text: "Dükkan veresiye çıkışı" },
    { id: "filtre", label: "Filtre", text: "Filtre seti" },
    { id: "yag", label: "Yağ", text: "Motor yağı" },
  ],
  torna: [
    { id: "krank", label: "Krank", text: "Krank taşlama" },
    { id: "kapak", label: "Silindir kapak", text: "Silindir kapak" },
    { id: "mil", label: "Mil", text: "Mil taşlama" },
    { id: "yatak", label: "Yatak", text: "Yatak / bronz" },
    { id: "rektifiye", label: "Rektifiye", text: "Rektifiye işi" },
  ],
};

export function bannerCopy(trade: TradeKind): {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
} {
  if (trade === "parca") {
    return {
      title: "Dükkanınız hazır!",
      body: "Örnek stok kalemlerin eklendi. Plaka ekranı değil — Stok ve tezgâh çıkışından başla.",
      ctaHref: "/inventory",
      ctaLabel: "Stok’a git",
    };
  }
  if (trade === "torna") {
    return {
      title: "Dükkanınız hazır!",
      body: "Örnek hizmet/stok hazır. Gelen işleri Geldi → İşlemde → Hazır diye takip et.",
      ctaHref: "/inventory",
      ctaLabel: "Stok’a bak",
    };
  }
  return {
    title: "Dükkanınız hazır!",
    body: "Listedeki 34 ORN 001 örnek iştir — inceleyip silebilirsiniz. İlk kendi aracını plaka kutusundan kabul et.",
    ctaHref: "/team",
    ctaLabel: "Usta ekle",
  };
}

export const COUNTER_BUCKET_LABELS = {
  open: "Açık sipariş",
  ready: "Hazır",
  credit: "Veresiye",
} as const;

export const TORNA_STATUS_LABELS = {
  intake: "Geldi",
  in_progress: "İşlemde",
  ready: "Hazır",
} as const;
