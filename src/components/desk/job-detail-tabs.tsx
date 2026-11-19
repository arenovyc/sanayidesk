"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { JobDetailTabDef, JobDetailTabId } from "@/lib/trade/profile";

const FALLBACK_TABS: JobDetailTabDef[] = [
  { id: "ozet", label: "Özet" },
  { id: "is", label: "İş & Parça" },
  { id: "tahsilat", label: "Tahsilat" },
  { id: "dis", label: "Dış iş" },
];

export type { JobDetailTabId };

export function JobDetailTabs({
  summary,
  panels,
  tabs = FALLBACK_TABS,
  defaultTab = "ozet",
}: {
  summary: ReactNode;
  panels: Partial<Record<JobDetailTabId, ReactNode>>;
  tabs?: JobDetailTabDef[];
  defaultTab?: JobDetailTabId;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = new Set(tabs.map((item) => item.id));
  const fromQuery = searchParams.get("tab");
  const tab: JobDetailTabId =
    fromQuery && allowed.has(fromQuery as JobDetailTabId)
      ? (fromQuery as JobDetailTabId)
      : defaultTab;

  function setTab(id: JobDetailTabId) {
    const next = new URLSearchParams(searchParams.toString());
    if (id === "ozet") next.delete("tab");
    else next.set("tab", id);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      {summary}
      <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 border-b border-neutral-200/80 bg-neutral-50/95 px-4 py-2 backdrop-blur">
        <div
          role="tablist"
          aria-label="İş emri bölümleri"
          className="flex gap-1 overflow-x-auto rounded-xl bg-neutral-200/70 p-1"
        >
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                id={`job-tab-${item.id}`}
                className={cn(
                  "min-h-10 flex-1 shrink-0 rounded-lg px-2.5 text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900",
                )}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        aria-labelledby={`job-tab-${tab}`}
        className="flex flex-col gap-4"
      >
        {panels[tab]}
      </div>
    </div>
  );
}
