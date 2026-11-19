"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Car,
  ClipboardList,
  LayoutGrid,
  ListTodo,
  Network,
  Package,
  Sun,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTradeProfile,
  type DeskNavIcon,
  type DeskNavItem,
} from "@/lib/trade/profile";
import type { TradeKind } from "@/lib/trade/kinds";

type NavVariant = "desk" | "lift" | "crew";

const ICON_MAP: Record<DeskNavIcon, LucideIcon> = {
  sun: Sun,
  board: ClipboardList,
  neighbors: Network,
  payments: Banknote,
  more: LayoutGrid,
  inventory: Package,
  credit: Wallet,
};

const STAFF_MENUS: Record<
  Exclude<NavVariant, "desk">,
  { href: string; label: string; icon: LucideIcon }[]
> = {
  lift: [
    { href: "/lift", label: "Liftim", icon: Car },
    { href: "/parts", label: "Parça", icon: Package },
  ],
  crew: [{ href: "/tasks", label: "Görevler", icon: ListTodo }],
};

function deskItems(tradeKind: TradeKind | undefined): DeskNavItem[] {
  return getTradeProfile(tradeKind).nav;
}

export function BottomNav({
  variant,
  tradeKind,
}: {
  variant: NavVariant;
  tradeKind?: TradeKind;
}) {
  const pathname = usePathname();
  const items =
    variant === "desk"
      ? deskItems(tradeKind).map((item) => ({
          href: item.href,
          label: item.label,
          icon: ICON_MAP[item.icon],
        }))
      : STAFF_MENUS[variant];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden">
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch={false}
                scroll={false}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-neutral-950" : "text-neutral-400",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
