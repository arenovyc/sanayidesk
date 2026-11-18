import Link from "next/link";
import { CounterAcceptForm } from "@/components/desk/counter-accept-form";
import { CounterStatusForm } from "@/components/desk/counter-status-form";
import { JobSearch } from "@/components/desk/job-search";
import { ShopCodeBanner } from "@/components/desk/shop-code-banner";
import { PageHeader } from "@/components/shells/page-header";
import { Button } from "@/components/ui/button";
import type { SessionContext } from "@/lib/auth/types";
import { listInventoryItems } from "@/lib/data/inventory";
import { getTodayBoard, searchWorkOrders } from "@/lib/data/work-orders";
import {
  COUNTER_BUCKET_LABELS,
  TORNA_STATUS_LABELS,
  type TradeKind,
} from "@/lib/trade/kinds";
import { workOrderLabel } from "@/lib/work-orders/display";
import { STATUS_LABELS } from "@/lib/work-orders/status";

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
    listInventoryItems(ctx.workspace.id),
  ]);

  const openJobs = board.jobs.filter(
    (j) => j.status === "intake" || j.status === "in_progress" || j.status === "waiting_parts" || j.status === "waiting_approval",
  );
  const readyJobs = board.jobs.filter((j) => j.status === "ready");
  const stockRows = inventory.schemaMissing ? [] : inventory.rows.slice(0, 5);

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
      <CounterAcceptForm
        tradeKind={tradeKind}
        showCredit={tradeKind === "parca"}
      />
      <JobSearch />

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-neutral-200 bg-white py-3">
          <dt className="text-xs text-neutral-500">{COUNTER_BUCKET_LABELS.open}</dt>
          <dd className="text-lg font-semibold">{openJobs.length}</dd>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white py-3">
          <dt className="text-xs text-neutral-500">{COUNTER_BUCKET_LABELS.ready}</dt>
          <dd className="text-lg font-semibold">{readyJobs.length}</dd>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white py-3">
          <dt className="text-xs text-neutral-500">{COUNTER_BUCKET_LABELS.credit}</dt>
          <dd className="text-lg font-semibold">
            <Link href="/b2b" className="underline-offset-4 hover:underline">
              Cari
            </Link>
          </dd>
        </div>
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
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {stockRows.map((item) => (
              <li key={item.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span>{item.name}</span>
                <span className="font-mono text-neutral-500">{item.qty}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {q ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Arama</h2>
          {searchHits.length === 0 ? (
            <p className="text-sm text-neutral-400">Sonuç yok.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {searchHits.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span>{workOrderLabel(job)}</span>
                    <span className="text-neutral-500">
                      {job.displayNo ?? STATUS_LABELS[job.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">
          {tradeKind === "torna" ? "Tezgâh işleri" : "Açık çıkışlar"}
        </h2>
        {board.jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center">
            <p className="text-sm text-neutral-500">
              {tradeKind === "torna"
                ? "Üstten iş başlığı yaz, Geldi olarak açılsın."
                : "Üstten müşteri veya parça yaz, çıkış kaydet."}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/inventory">Stok</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {board.jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-medium hover:underline"
                    >
                      {workOrderLabel(job)}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {tradeKind === "torna" &&
                      (job.status === "intake" ||
                        job.status === "in_progress" ||
                        job.status === "ready")
                        ? TORNA_STATUS_LABELS[job.status]
                        : STATUS_LABELS[job.status]}
                      {job.customerName ? ` · ${job.customerName}` : null}
                    </p>
                  </div>
                </div>
                {tradeKind === "torna" &&
                (job.status === "intake" ||
                  job.status === "in_progress" ||
                  job.status === "ready") ? (
                  <div className="mt-3">
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
    </div>
  );
}
