"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Car,
  ClipboardList,
  LayoutGrid,
  ListTodo,
  Package,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavVariant = "desk" | "lift" | "crew";

const MENUS: Record<NavVariant, { href: string; label: string; icon: LucideIcon }[]> = {
  desk: [
    { href: "/today", label: "Bugün", icon: Sun },
    { href: "/board", label: "İşler", icon: ClipboardList },
    { href: "/payments", label: "Tahsilat", icon: Banknote },
    { href: "/more", label: "Daha fazla", icon: LayoutGrid },
  ],
  lift: [
    { href: "/lift", label: "Liftim", icon: Car },
    { href: "/parts", label: "Parça", icon: Package },
  ],
  crew: [{ href: "/tasks", label: "Görevler", icon: ListTodo }],
};

export function BottomNav({ variant }: { variant: NavVariant }) {
  const pathname = usePathname();
  const items = MENUS[variant];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden">
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium",
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
