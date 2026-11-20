import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { Money } from "@/components/ui/money";
import { StatusBadge } from "@/components/ui/status-badge";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/lib/work-orders/status";

/** Static product preview — light desk UI, same tokens/components as the real board. */
export function HomeBoardPreview() {
  return (
    <div
      aria-hidden
      className={cn(
        surfaceCard,
        "relative w-full overflow-hidden shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)]",
      )}
    >
      <div className="border-b border-neutral-200/80 bg-[var(--surface-page)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-neutral-500">Başkent Oto</p>
            <h3 className="text-base font-semibold tracking-tight text-neutral-950">
              Tahta
            </h3>
          </div>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium tabular-nums text-neutral-500">
            Bugün
          </span>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {[
            { label: "Kabul", n: 1, on: false },
            { label: "Onay", n: 1, on: false },
            { label: "İçeride", n: 2, on: true },
            { label: "Parça", n: 1, on: false },
            { label: "Hazır", n: 1, on: false },
          ].map((tab) => (
            <span
              key={tab.label}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium",
                tab.on
                  ? "bg-neutral-950 text-white"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200",
              )}
            >
              {tab.label}{" "}
              <span className={tab.on ? "text-neutral-300" : "text-neutral-400"}>
                {tab.n}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2 bg-[var(--surface-page)] p-3">
        <PreviewCard
          plate="06MGN055"
          displayNo="#0033"
          wait="26s"
          makeModel="Renault Megane 4"
          complaint="Triger seti + devirdaim değişimi"
          assignee="Mehmet Usta"
          status="in_progress"
          due={11500}
          remaining={8500}
        />
        <PreviewCard
          plate="06TRN088"
          displayNo="#0032"
          wait="2g"
          makeModel="Ford Transit 2.2"
          complaint="Enjektör revizyonu + mazot filtresi"
          assignee="Ahmet Usta"
          status="in_progress"
          due={2950}
          remaining={2950}
        />
      </div>

      <div className="border-t border-neutral-200/80 bg-white px-4 py-3">
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Gerçek panel: plaka kabul, usta atama, WhatsApp onay, tahsilat.
        </p>
      </div>
    </div>
  );
}

function PreviewCard({
  plate,
  displayNo,
  wait,
  makeModel,
  complaint,
  assignee,
  status,
  due,
  remaining,
}: {
  plate: string;
  displayNo: string;
  wait: string;
  makeModel: string;
  complaint: string;
  assignee: string;
  status: WorkOrderStatus;
  due: number;
  remaining: number;
}) {
  return (
    <div className={cn(surfaceCard, "flex flex-col gap-1.5 p-3")}>
      <div className="flex items-start justify-between gap-2">
        <LicensePlateBadge plate={plate} size="sm" />
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-[11px] tabular-nums text-neutral-400">
            {displayNo}
          </span>
          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-amber-800">
            {wait}
          </span>
        </div>
      </div>

      <p className="truncate text-sm font-semibold text-neutral-950">
        {makeModel}
      </p>
      <p className="line-clamp-2 text-xs text-neutral-600">{complaint}</p>

      <div className="mt-0.5 flex items-end justify-between gap-2">
        <p className="truncate text-xs text-neutral-500">{assignee}</p>
        <p className="shrink-0 text-right text-xs text-neutral-600">
          <Money amount={due} tone="muted" />
          {" · "}
          <Money amount={remaining} tone="debt" />
        </p>
      </div>

      <div className="pt-0.5">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
