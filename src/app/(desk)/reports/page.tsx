import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import {
  defaultReportRange,
  getReportSummary,
} from "@/lib/data/reports";
import { formatMoney } from "@/lib/format/money";
import { reportRangeSchema } from "@/lib/validations/reports";

export default function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <ReportsBody searchParams={searchParams} />
    </Suspense>
  );
}

async function ReportsBody({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") redirect("/more");

  const query = await searchParams;
  const defaults = defaultReportRange();
  const parsed = reportRangeSchema.safeParse({
    from: query.from ?? defaults.from,
    to: query.to ?? defaults.to,
  });
  const from = parsed.success ? parsed.data.from : defaults.from;
  const to = parsed.success ? parsed.data.to : defaults.to;
  const summary = await getReportSummary(ctx.workspace.id, from, to);
  const exportHref = `/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/more" className="hover:underline">
            Daha fazla
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold">Raporlar</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gün / dönem özeti (İstanbul saati).
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs text-neutral-500">
            Başlangıç
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="h-11 rounded-lg border border-neutral-200 px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs text-neutral-500">
            Bitiş
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="h-11 rounded-lg border border-neutral-200 px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-neutral-950 px-4 text-sm font-medium text-white"
        >
          Uygula
        </button>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2">
        <li className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500">Açık iş</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.openJobs}
          </p>
        </li>
        <li className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500">Tahsilat (dönem)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(summary.collected)}
          </p>
        </li>
        <li className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500">Veresiye yazılan (dönem)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(summary.creditBooked)}
          </p>
        </li>
        <li className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500">Müşteri cari net</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(summary.customerDebtTotal)}
          </p>
        </li>
        <li className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 sm:col-span-2">
          <p className="text-xs text-neutral-500">Taşeron B2B net toplam</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(summary.b2bNetTotal)}
          </p>
        </li>
      </ul>

      <a
        href={exportHref}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium"
      >
        Tahsilat CSV indir
      </a>
    </div>
  );
}
