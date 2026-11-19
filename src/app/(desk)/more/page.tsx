import Link from "next/link";
import {
  Car,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  History,
  Network,
  Package,
  Settings,
  Share2,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { PageHeader } from "@/components/shells/page-header";
import { requireDeskSession } from "@/lib/auth/get-membership";
import {
  getTradeProfile,
  type MoreLinkId,
} from "@/lib/trade/profile";

type MoreLink = { id: MoreLinkId; href: string; label: string; icon: LucideIcon };

export default async function MorePage() {
  const ctx = await requireDeskSession();
  const isOwner = ctx.membership.role === "owner";
  const profile = getTradeProfile(ctx.workspace.tradeKind);
  const hide = new Set(profile.moreHide);

  const rawSections: { title: string; links: MoreLink[] }[] = [
    {
      title: "İş",
      links: [
        { id: "customers", href: "/customers", label: "Müşteriler", icon: Users },
        { id: "vehicles", href: "/vehicles", label: "Araçlar", icon: Car },
        {
          id: "appointments",
          href: "/appointments",
          label: "Randevular",
          icon: ClipboardList,
        },
        { id: "load", href: "/load", label: "Yük dağılımı", icon: FolderKanban },
        { id: "inventory", href: "/inventory", label: "Stok", icon: Package },
      ],
    },
    {
      title: "Para",
      links: [
        ...(isOwner
          ? ([
              {
                id: "reports",
                href: "/reports",
                label: "Raporlar",
                icon: Wallet,
              },
              {
                id: "bonuses",
                href: "/bonuses",
                label: "Usta primleri",
                icon: Wrench,
              },
            ] satisfies MoreLink[])
          : []),
        {
          id: "b2b",
          href: "/b2b",
          label: profile.family === "counter" ? "Veresiye / cari" : "Taşeron / cari",
          icon: Wallet,
        },
      ],
    },
    {
      title: "Ağ",
      links: [
        { id: "neighbors", href: "/neighbors", label: "Komşular", icon: Network },
        {
          id: "directory",
          href: "/neighbors#rehber",
          label: "Rehber",
          icon: Package,
        },
        {
          id: "network",
          href: "/neighbors#ag",
          label: "Sanayi ağı",
          icon: Network,
        },
        {
          id: "messages",
          href: "/messages",
          label: "Paylaşım kayıtları",
          icon: Share2,
        },
      ],
    },
    {
      title: "Hesap",
      links: [
        { id: "account", href: "/settings/account", label: "Hesap", icon: Settings },
        { id: "audit", href: "/audit", label: "İşlem geçmişi", icon: History },
        ...(isOwner
          ? ([
              {
                id: "settings",
                href: "/settings",
                label: "Ayarlar",
                icon: Settings,
              },
              {
                id: "team",
                href: "/team",
                label: "Personel",
                icon: Users,
              },
            ] satisfies MoreLink[])
          : []),
      ],
    },
  ];

  const sections = rawSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => !hide.has(link.id)),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Daha fazla"
        description={`${profile.shortLabel} — müşteri, stok, rapor ve ayarlar.`}
      />
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="px-0.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
            {section.title}
          </h2>
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
            {section.links.map((item) => {
              const Icon = item.icon;
              return (
                <li key={`${item.id}-${item.href}`}>
                  <Link
                    href={item.href}
                    className="flex min-h-12 items-center gap-3 px-4 py-3.5 text-sm"
                  >
                    <Icon
                      className="size-4 shrink-0 text-neutral-400"
                      aria-hidden
                    />
                    <span className="flex-1 font-medium text-neutral-950">
                      {item.label}
                    </span>
                    <ChevronRight className="size-4 text-neutral-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <InstallAppCard />
      <p className="text-center text-xs text-neutral-400">
        Çıkış için üst çubuktaki Çıkış’ı kullan.
      </p>
    </div>
  );
}
