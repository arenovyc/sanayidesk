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

type MoreLink = { href: string; label: string; icon: LucideIcon };

export default async function MorePage() {
  const ctx = await requireDeskSession();
  const isOwner = ctx.membership.role === "owner";

  const sections: { title: string; links: MoreLink[] }[] = [
    {
      title: "İş",
      links: [
        { href: "/customers", label: "Müşteriler", icon: Users },
        { href: "/vehicles", label: "Araçlar", icon: Car },
        { href: "/appointments", label: "Randevular", icon: ClipboardList },
        { href: "/load", label: "Yük dağılımı", icon: FolderKanban },
        { href: "/inventory", label: "Stok", icon: Package },
      ],
    },
    {
      title: "Para",
      links: [
        ...(isOwner
          ? [
              { href: "/reports", label: "Raporlar", icon: Wallet } as MoreLink,
              {
                href: "/bonuses",
                label: "Usta primleri",
                icon: Wrench,
              } as MoreLink,
            ]
          : []),
        { href: "/b2b", label: "Taşeron / cari", icon: Wallet },
      ],
    },
    {
      title: "Ağ",
      links: [
        { href: "/neighbors", label: "Komşular", icon: Network },
        { href: "/directory", label: "Parçacı rehberi", icon: Package },
        { href: "/network", label: "Sanayi ağı", icon: Network },
        { href: "/messages", label: "Paylaşım kayıtları", icon: Share2 },
      ],
    },
    {
      title: "Hesap",
      links: [
        { href: "/settings/account", label: "Hesap", icon: Settings },
        { href: "/audit", label: "İşlem geçmişi", icon: History },
        ...(isOwner
          ? [
              { href: "/settings", label: "Ayarlar", icon: Settings } as MoreLink,
              { href: "/team", label: "Personel", icon: Users } as MoreLink,
            ]
          : []),
      ],
    },
  ].filter((section) => section.links.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Daha fazla"
        description="Müşteri, stok, rapor ve ayarlar."
      />
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="px-0.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
            {section.title}
          </h2>
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {section.links.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm"
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
