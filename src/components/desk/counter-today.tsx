import Link from "next/link";
import { Package } from "lucide-react";
import { CounterAcceptForm } from "@/components/desk/counter-accept-form";
import { CounterSaleForm } from "@/components/desk/counter-sale-form";
import { CounterStatusForm } from "@/components/desk/counter-status-form";
import { JobRow } from "@/components/desk/job-row";
import { JobSearch } from "@/components/desk/job-search";
import { OnboardingChecklist } from "@/components/desk/onboarding-checklist";
import { ShopCodeBanner } from "@/components/desk/shop-code-banner";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getTradeProfile } from "@/lib/trade/profile";
import { isLowStock } from "@/lib/inventory/rules";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { SessionContext } from "@/lib/auth/types";
import { listInventoryItems } from "@/lib/data/inventory";
import { getTodayBoard, searchWorkOrders } from "@/lib/data/work-orders";
import {
  COUNTER_BUCKET_LABELS,
  type TradeKind,
} from "@/lib/trade/kinds";

export async function CounterToday({
  ctx,
  tradeKind,
  shopCode,
  q,
}: {
  ctx: SessionContext;
  tradeKind: TradeKind;
  shopCode?: string;
  q?: string;
}) {
  const [board, searchHits, inventory] = await Promise.all([
    getTodayBoard(ctx.workspace.id),
    q ? searchWorkOrders(ctx.workspace.id, q) : Promise.resolve([]),
    listInventoryItems(ctx.workspace.id, { includeReserved: false }),
  ]);

  const profile = getTradeProfile(tradeKind);
  const openJobs = board.jobs.filter(
    (j) =>
      j.status === "intake" ||
      j.status === "in_progress" ||
      j.status === "waiting_parts" ||
      j.status === "waiting_approval",
  );
  const readyJobs = board.jobs.filter((j) => j.status === "ready");
  const stockRows = inventory.schemaMissing ? [] : inventory.rows;
  const lowStock = stockRows.filter((item) =>
    isLowStock(item.availableQty, item.minQty),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Bugün"
        description={
          tradeKind === "torna"
            ? "Gelen iş, durum takibi ve hazır teslim."
            : "Hızlı çıkış, stok ve veresiye."
        }
      />
      <ShopCodeBanner shopCode={shopCode} tradeKind={tradeKind} />
      <OnboardingChecklist steps={profile.onboardingSteps} />

      {tradeKind === "parca" ? (
        <CounterSaleForm
          tradeKind={tradeKind}
          stockItems={stockRows.map((r) => ({
            id: r.id,
            name: r.name,
            qty: r.availableQty ?? r.qty,
            unitCost: r.unitCost,
          }))}
        />
      ) : (
        <CounterAcceptForm tradeKind={tradeKind} showCredit={false} />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">
          {tradeKind === "torna" ? "Tezgâh işleri" : "Açık çıkışlar"}
        </h2>
        {board.jobs.length === 0 ? (
          <EmptyState
            icon={Package}
            title={profile.labels.emptyToday}
            description="İlk satışı yukarıdan kaydet."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {board.jobs.map((job) => (
              <li key={job.id} className="flex flex-col gap-2">
                <JobRow
                  job={job}
                  tradeKind={tradeKind}
                  subtitle={job.customerName ?? undefined}
                />
                {tradeKind === "torna" &&
                (job.status === "intake" ||
                  job.status === "in_progress" ||
                  job.status === "ready") ? (
                  <div className={cn(surfaceCard, "px-4 py-3")}>
                    <CounterStatusForm
                      workOrderId={job.id}
                      status={job.status}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <Link
          href="/board"
          className={cn(surfaceCard, "py-3 transition-colors hover:bg-neutral-50")}
        >
          <dt className="text-xs text-neutral-500">{COUNTER_BUCKET_LABELS.open}</dt>
          <dd className="text-lg font-semibold tabular-nums">{openJobs.length}</dd>
        </Link>
        <Link
          href="/board?status=ready"
          className={cn(surfaceCard, "py-3 transition-colors hover:bg-neutral-50")}
        >
          <dt className="text-xs text-neutral-500">{COUNTER_BUCKET_LABELS.ready}</dt>
          <dd className="text-lg font-semibold tabular-nums">{readyJobs.length}</dd>
        </Link>
        <Link
          href="/b2b"
          className={cn(surfaceCard, "py-3 transition-colors hover:bg-neutral-50")}
        >
          <dt className="text-xs text-neutral-500">{COUNTER_BUCKET_LABELS.credit}</dt>
          <dd className="text-sm font-semibold">Cari</dd>
        </Link>
      </dl>

      {stockRows.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-neutral-500">Stok özeti</h2>
            <Link
              href="/inventory"
              className="text-xs font-medium text-neutral-500 underline-offset-4 hover:underline"
            >
              Tümü
            </Link>
          </div>
          <div className={cn(surfaceCard, "px-4 py-3 text-sm")}>
            <p>
              <span className="tabular-nums font-semibold">{stockRows.length}</span>
              {" "}kalem
              {lowStock.length > 0 ? (
                <span className="text-orange-700">
                  {" "}
                  · {lowStock.length} düşük stok
                </span>
              ) : null}
            </p>
            {lowStock.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1 text-neutral-600">
                {lowStock.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="truncate">{item.name}</span>
                    <span className="tabular-nums text-orange-700">
                      {item.availableQty}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      <JobSearch placeholder="İsim veya iş no" />

      {q ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Arama</h2>
          {searchHits.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Bu plaka veya isim açık işlerde yok.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {searchHits.map((job) => (
                <li key={job.id}>
                  <JobRow job={job} tradeKind={tradeKind} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
