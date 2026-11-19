import {
  QUICK_PRESETS,
  TRADE_KIND_LABELS,
  TRADE_KINDS,
  type QuickPreset,
  type TradeKind,
  isCounterTrade,
  isTradeKind,
} from "@/lib/trade/kinds";
import type { WorkOrderStatus } from "@/lib/work-orders/status";
import { STATUS_LABELS } from "@/lib/work-orders/status";

export type TradeFamily = "workshop" | "counter";

export type DeskNavIcon =
  | "sun"
  | "board"
  | "neighbors"
  | "payments"
  | "more"
  | "inventory"
  | "credit";

export type DeskNavItem = {
  href: string;
  label: string;
  icon: DeskNavIcon;
};

export type MoreLinkId =
  | "customers"
  | "vehicles"
  | "appointments"
  | "load"
  | "inventory"
  | "reports"
  | "bonuses"
  | "b2b"
  | "neighbors"
  | "directory"
  | "network"
  | "messages"
  | "account"
  | "audit"
  | "settings"
  | "team";

export type JobDetailSections = {
  checkup: boolean;
  entryKm: boolean;
  remind: boolean;
  mediaFirst: boolean;
  stockIssuePrimary: boolean;
  complaintFirst: boolean;
  intakeNeeds: "workshop" | "counter";
};

export type TradeBanner = {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
};

export type OnboardingStep = {
  id: string;
  label: string;
  href: string;
};

export type TradeProfile = {
  kind: TradeKind;
  family: TradeFamily;
  label: string;
  shortLabel: string;
  labels: {
    jobNoun: string;
    acceptNoun: string;
    customerNoun: string;
    emptyToday: string;
    boardTitle: string;
    boardDescription: string;
  };
  statusLabels: Partial<Record<WorkOrderStatus, string>>;
  nav: DeskNavItem[];
  moreHide: MoreLinkId[];
  morePriority: MoreLinkId[];
  jobDetail: JobDetailSections;
  boardVariant: "kanban" | "queue" | "counterList";
  presets: QuickPreset[];
  banner: TradeBanner;
  onboardingSteps: OnboardingStep[];
  complementaryTrades: TradeKind[];
  landingSteps: { title: string; body: string }[];
};

const WORKSHOP_NAV: DeskNavItem[] = [
  { href: "/today", label: "Bugün", icon: "sun" },
  { href: "/board", label: "İşler", icon: "board" },
  { href: "/neighbors", label: "Komşular", icon: "neighbors" },
  { href: "/payments", label: "Tahsilat", icon: "payments" },
  { href: "/more", label: "Daha fazla", icon: "more" },
];

const LASTIK_NAV: DeskNavItem[] = [
  { href: "/today", label: "Bugün", icon: "sun" },
  { href: "/board", label: "Sıra", icon: "board" },
  { href: "/neighbors", label: "Komşular", icon: "neighbors" },
  { href: "/payments", label: "Tahsilat", icon: "payments" },
  { href: "/more", label: "Daha fazla", icon: "more" },
];

const PARCA_NAV: DeskNavItem[] = [
  { href: "/today", label: "Bugün", icon: "sun" },
  { href: "/board", label: "Satışlar", icon: "board" },
  { href: "/inventory", label: "Stok", icon: "inventory" },
  { href: "/b2b", label: "Veresiye", icon: "credit" },
  { href: "/more", label: "Daha fazla", icon: "more" },
];

const TORNA_NAV: DeskNavItem[] = [
  { href: "/today", label: "Bugün", icon: "sun" },
  { href: "/board", label: "İşler", icon: "board" },
  { href: "/neighbors", label: "Komşular", icon: "neighbors" },
  { href: "/payments", label: "Tahsilat", icon: "payments" },
  { href: "/more", label: "Daha fazla", icon: "more" },
];

const WORKSHOP_MORE_HIDE: MoreLinkId[] = [];
const PARCA_MORE_HIDE: MoreLinkId[] = [
  "vehicles",
  "appointments",
  "load",
  "directory",
  "network",
];
const TORNA_MORE_HIDE: MoreLinkId[] = ["vehicles", "appointments", "load"];

function workshopBanner(): TradeBanner {
  return {
    title: "Dükkanınız hazır!",
    body: "Listedeki 34 ORN 001 örnek iştir — iş detayından listeden kaldırabilirsiniz. İlk kendi aracını plaka kutusundan kabul et.",
    ctaHref: "/team",
    ctaLabel: "Usta ekle",
  };
}

const PROFILES: Record<TradeKind, TradeProfile> = {
  tamir: {
    kind: "tamir",
    family: "workshop",
    label: TRADE_KIND_LABELS.tamir,
    shortLabel: "Tamir",
    labels: {
      jobNoun: "İş emri",
      acceptNoun: "Plaka kabul",
      customerNoun: "Müşteri",
      emptyToday: "Üstten plaka yaz, iş emri açılsın.",
      boardTitle: "Tahta",
      boardDescription: "Sürükle = durum. Usta seçince kaydolur.",
    },
    statusLabels: {},
    nav: WORKSHOP_NAV,
    moreHide: WORKSHOP_MORE_HIDE,
    morePriority: ["customers", "inventory", "team"],
    jobDetail: {
      checkup: true,
      entryKm: true,
      remind: true,
      mediaFirst: false,
      stockIssuePrimary: false,
      complaintFirst: false,
      intakeNeeds: "workshop",
    },
    boardVariant: "kanban",
    presets: QUICK_PRESETS.tamir,
    banner: workshopBanner(),
    onboardingSteps: [
      { id: "team", label: "Usta ekle", href: "/team" },
      { id: "accept", label: "İlk aracı kabul et", href: "/today" },
      { id: "neighbors", label: "Komşulara bak", href: "/neighbors" },
    ],
    complementaryTrades: ["parca", "torna"],
    landingSteps: [
      {
        title: "Plaka kabul",
        body: "Gelen aracı saniyeler içinde kaydet; tahtada takip et.",
      },
      {
        title: "WhatsApp fiyat onayı",
        body: "Kalemleri gir, müşteriye onay linki veya mesaj gönder.",
      },
      {
        title: "Kasa & bakım",
        body: "Tahsilat, veresiye ve bakım hatırlatması.",
      },
    ],
  },
  kaporta: {
    kind: "kaporta",
    family: "workshop",
    label: TRADE_KIND_LABELS.kaporta,
    shortLabel: "Kaporta",
    labels: {
      jobNoun: "İş emri",
      acceptNoun: "Plaka kabul",
      customerNoun: "Müşteri",
      emptyToday: "Plaka + foto ile ekspertiz başlat.",
      boardTitle: "Tahta",
      boardDescription: "Onay ve fotoğraflı işler — sürükle ile durum.",
    },
    statusLabels: {
      waiting_approval: "Fiyat onayı",
      in_progress: "Atölyede",
    },
    nav: WORKSHOP_NAV,
    moreHide: WORKSHOP_MORE_HIDE,
    morePriority: ["customers", "inventory", "team"],
    jobDetail: {
      checkup: false,
      entryKm: false,
      remind: false,
      mediaFirst: true,
      stockIssuePrimary: false,
      complaintFirst: false,
      intakeNeeds: "workshop",
    },
    boardVariant: "kanban",
    presets: QUICK_PRESETS.kaporta,
    banner: workshopBanner(),
    onboardingSteps: [
      { id: "team", label: "Usta ekle", href: "/team" },
      { id: "accept", label: "İlk işi foto ile aç", href: "/today" },
      { id: "neighbors", label: "Komşular", href: "/neighbors" },
    ],
    complementaryTrades: ["parca", "elektrik"],
    landingSteps: [
      {
        title: "Plaka + foto",
        body: "Ekspertiz fotoğraflarıyla işi aç, onay bekle.",
      },
      {
        title: "Fiyat onayı",
        body: "WhatsApp ile teklif gönder, onay linki paylaş.",
      },
      {
        title: "Teslim",
        body: "Hazır olunca müşteriye haber ver, tahsilat al.",
      },
    ],
  },
  elektrik: {
    kind: "elektrik",
    family: "workshop",
    label: TRADE_KIND_LABELS.elektrik,
    shortLabel: "Elektrik",
    labels: {
      jobNoun: "İş emri",
      acceptNoun: "Plaka kabul",
      customerNoun: "Müşteri",
      emptyToday: "Plaka yaz, arıza notunu ekle.",
      boardTitle: "Tahta",
      boardDescription: "Arıza ve klima işleri — durum sürükle.",
    },
    statusLabels: {},
    nav: WORKSHOP_NAV,
    moreHide: WORKSHOP_MORE_HIDE,
    morePriority: ["customers", "inventory", "team"],
    jobDetail: {
      checkup: true,
      entryKm: false,
      remind: false,
      mediaFirst: false,
      stockIssuePrimary: false,
      complaintFirst: true,
      intakeNeeds: "workshop",
    },
    boardVariant: "kanban",
    presets: QUICK_PRESETS.elektrik,
    banner: workshopBanner(),
    onboardingSteps: [
      { id: "team", label: "Usta ekle", href: "/team" },
      { id: "accept", label: "İlk arızayı kaydet", href: "/today" },
      { id: "neighbors", label: "Komşular", href: "/neighbors" },
    ],
    complementaryTrades: ["parca", "tamir"],
    landingSteps: [
      {
        title: "Arıza kaydı",
        body: "Plaka + şikayet; diagnostik notları işte kalsın.",
      },
      {
        title: "Parça & işçilik",
        body: "Kalem ekle, onay al, usta ata.",
      },
      {
        title: "Hazır bildir",
        body: "WhatsApp ile müşteriye haber ver.",
      },
    ],
  },
  lastik: {
    kind: "lastik",
    family: "workshop",
    label: TRADE_KIND_LABELS.lastik,
    shortLabel: "Lastik",
    labels: {
      jobNoun: "İş",
      acceptNoun: "Plaka kabul",
      customerNoun: "Müşteri",
      emptyToday: "Hızlı plaka — sıraya al.",
      boardTitle: "Sıra",
      boardDescription: "Bekleyen araçlar tek listede.",
    },
    statusLabels: {
      intake: "Sırada",
      in_progress: "İşlemde",
    },
    nav: LASTIK_NAV,
    moreHide: WORKSHOP_MORE_HIDE,
    morePriority: ["customers", "appointments", "team"],
    jobDetail: {
      checkup: false,
      entryKm: false,
      remind: false,
      mediaFirst: false,
      stockIssuePrimary: false,
      complaintFirst: false,
      intakeNeeds: "workshop",
    },
    boardVariant: "queue",
    presets: QUICK_PRESETS.lastik,
    banner: workshopBanner(),
    onboardingSteps: [
      { id: "accept", label: "İlk plakayı sıraya al", href: "/today" },
      { id: "team", label: "Usta / PIN ekle", href: "/team" },
      { id: "neighbors", label: "Komşular", href: "/neighbors" },
    ],
    complementaryTrades: ["parca", "tamir"],
    landingSteps: [
      {
        title: "Hızlı plaka",
        body: "Sıraya al, rot-balans veya lastik değişimini takip et.",
      },
      {
        title: "Sıra ekranı",
        body: "Bekleyen araçları tek listede gör.",
      },
      {
        title: "Tahsilat",
        body: "Hazır olunca tahsil et, müşteriye yaz.",
      },
    ],
  },
  parca: {
    kind: "parca",
    family: "counter",
    label: TRADE_KIND_LABELS.parca,
    shortLabel: "Parça",
    labels: {
      jobNoun: "Çıkış",
      acceptNoun: "Satış / çıkış",
      customerNoun: "Müşteri / dükkan",
      emptyToday: "Müşteri veya parça yaz, stoktan sat.",
      boardTitle: "Satışlar",
      boardDescription: "Açık çıkışlar ve durum.",
    },
    statusLabels: {
      intake: "Hazırlanıyor",
      in_progress: "Hazırlanıyor",
      waiting_parts: "Beklemede",
      ready: "Hazır",
      delivered: "Teslim edildi",
    },
    nav: PARCA_NAV,
    moreHide: PARCA_MORE_HIDE,
    morePriority: ["inventory", "b2b", "neighbors", "customers"],
    jobDetail: {
      checkup: false,
      entryKm: false,
      remind: false,
      mediaFirst: false,
      stockIssuePrimary: true,
      complaintFirst: false,
      intakeNeeds: "counter",
    },
    boardVariant: "counterList",
    presets: QUICK_PRESETS.parca,
    banner: {
      title: "Dükkanınız hazır!",
      body: "Örnek stok kalemlerin eklendi. Plaka ekranı değil — Stok ve tezgâh çıkışından başla.",
      ctaHref: "/inventory",
      ctaLabel: "Stok’a git",
    },
    onboardingSteps: [
      { id: "stock", label: "Örnek stoğu kontrol et", href: "/inventory" },
      { id: "sale", label: "İlk satışı kaydet", href: "/today" },
      { id: "neighbors", label: "Komşulara bak", href: "/neighbors" },
    ],
    complementaryTrades: ["tamir", "kaporta", "elektrik", "lastik", "torna"],
    landingSteps: [
      {
        title: "Tezgâh çıkışı",
        body: "Müşteri veya komşu dükkan + stoktan sat, veresiye yaz.",
      },
      {
        title: "Stok",
        body: "Düşük stok uyarısı, transfer ve cari tek yerde.",
      },
      {
        title: "Komşular",
        body: "WhatsApp ile stok sor, ağdaki atölyelere ulaş.",
      },
    ],
  },
  torna: {
    kind: "torna",
    family: "counter",
    label: TRADE_KIND_LABELS.torna,
    shortLabel: "Torna",
    labels: {
      jobNoun: "Tezgâh işi",
      acceptNoun: "İş aç",
      customerNoun: "Gönderen dükkan",
      emptyToday: "Gönderen dükkan / iş başlığı yaz.",
      boardTitle: "İşler",
      boardDescription: "Geldi → İşlemde → Hazır.",
    },
    statusLabels: {
      intake: "Geldi",
      in_progress: "İşlemde",
      ready: "Hazır",
      delivered: "Teslim",
    },
    nav: TORNA_NAV,
    moreHide: TORNA_MORE_HIDE,
    morePriority: ["inventory", "b2b", "neighbors", "customers"],
    jobDetail: {
      checkup: false,
      entryKm: false,
      remind: false,
      mediaFirst: false,
      stockIssuePrimary: false,
      complaintFirst: false,
      intakeNeeds: "counter",
    },
    boardVariant: "counterList",
    presets: QUICK_PRESETS.torna,
    banner: {
      title: "Dükkanınız hazır!",
      body: "Örnek hizmet/stok hazır. Gelen işleri Geldi → İşlemde → Hazır diye takip et.",
      ctaHref: "/inventory",
      ctaLabel: "Stok’a bak",
    },
    onboardingSteps: [
      { id: "job", label: "İlk tezgâh işini aç", href: "/today" },
      { id: "directory", label: "Gönderen dükkanı rehbere ekle", href: "/directory" },
      { id: "neighbors", label: "Komşular", href: "/neighbors" },
    ],
    complementaryTrades: ["tamir", "parca"],
    landingSteps: [
      {
        title: "İş aç",
        body: "Gönderen dükkan + iş başlığı; Geldi diye başla.",
      },
      {
        title: "Durum takip",
        body: "İşlemde → Hazır; gönderene WhatsApp yaz.",
      },
      {
        title: "Cari",
        body: "Gölge cari ile hangi dükkandan ne geldiğini tut.",
      },
    ],
  },
};

export function getTradeProfile(kind: string | null | undefined): TradeProfile {
  if (kind && isTradeKind(kind)) return PROFILES[kind];
  return PROFILES.tamir;
}

export function statusLabelFor(
  kind: string | null | undefined,
  status: WorkOrderStatus,
): string {
  const profile = getTradeProfile(kind);
  return profile.statusLabels[status] ?? STATUS_LABELS[status];
}

export type JobDetailTabId = "ozet" | "is" | "tahsilat" | "dis";

export type JobDetailTabDef = { id: JobDetailTabId; label: string };

const WORKSHOP_JOB_TABS: JobDetailTabDef[] = [
  { id: "ozet", label: "Özet" },
  { id: "is", label: "İş & Parça" },
  { id: "tahsilat", label: "Tahsilat" },
  { id: "dis", label: "Dış iş" },
];

export function jobDetailTabsFor(kind: string | null | undefined): JobDetailTabDef[] {
  const profile = getTradeProfile(kind);
  if (profile.kind === "parca") {
    return [
      { id: "ozet", label: "Özet" },
      { id: "is", label: "Satış" },
      { id: "tahsilat", label: "Tahsilat" },
    ];
  }
  if (profile.kind === "torna") {
    return [
      { id: "ozet", label: "Özet" },
      { id: "is", label: "İş" },
      { id: "tahsilat", label: "Tahsilat" },
    ];
  }
  return WORKSHOP_JOB_TABS;
}

export function allTradeProfiles(): TradeProfile[] {
  return TRADE_KINDS.map((k) => PROFILES[k]);
}

export function profileFamily(kind: string | null | undefined): TradeFamily {
  return getTradeProfile(kind).family;
}

/** kinds.ts uyumluluğu — bannerCopy profil üzerinden */
export function bannerFromProfile(trade: TradeKind): TradeBanner {
  return getTradeProfile(trade).banner;
}

export function assertProfilesComplete(): void {
  for (const kind of TRADE_KINDS) {
    const p = PROFILES[kind];
    if (p.nav.length !== 5) throw new Error(`${kind}: nav must be 5`);
    if (p.presets.length < 3) throw new Error(`${kind}: presets`);
    if (p.onboardingSteps.length < 2) throw new Error(`${kind}: onboarding`);
    if (p.landingSteps.length !== 3) throw new Error(`${kind}: landing`);
    if (isCounterTrade(kind) && p.family !== "counter") {
      throw new Error(`${kind}: family`);
    }
    if (!isCounterTrade(kind) && p.family !== "workshop") {
      throw new Error(`${kind}: family`);
    }
  }
}
