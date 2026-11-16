"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type JobDetailTabId = "ozet" | "is" | "tahsilat" | "dis";

const TABS: { id: JobDetailTabId; label: string }[] = [
  { id: "ozet", label: "Özet" },
  { id: "is", label: "İş & Parça" },
  { id: "tahsilat", label: "Tahsilat" },
  { id: "dis", label: "Dış iş" },
];

export function JobDetailTabs({
  summary,
  panels,
  defaultTab = "ozet",
}: {
  summary: ReactNode;
  panels: Record<JobDetailTabId, ReactNode>;
  defaultTab?: JobDetailTabId;
}) {
  const [tab, setTab] = useState<JobDetailTabId>(defaultTab);

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 border-b border-neutral-200 bg-neutral-50/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/90">
        {summary}
        <div
          role="tablist"
          aria-label="İş emri bölümleri"
          className="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-neutral-200/70 p-1"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                id={`job-tab-${item.id}`}
                className={cn(
                  "min-h-9 flex-1 shrink-0 rounded-lg px-2.5 text-xs font-medium transition-colors sm:text-sm",
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
