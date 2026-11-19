import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintFormatToggle } from "@/components/desk/print-format-toggle";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { getWorkOrderDetail } from "@/lib/data/work-orders";
import { formatMoney } from "@/lib/format/money";
import { approvalPageUrl } from "@/lib/supabase/env";
import { requestNow } from "@/lib/time/request-now";
import { remainingDue } from "@/lib/work-orders/money";
import { STATUS_LABELS } from "@/lib/work-orders/status";

const METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale",
  credit: "Veresiye",
};

const KIND_LABELS: Record<string, string> = {
  labor: "İşçilik",
  part: "Parça",
  other: "Diğer",
};

export default function JobPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <JobPrintBody params={params} />
    </Suspense>
  );
}

async function JobPrintBody({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireDeskSession();
  const { id } = await params;
  const job = await getWorkOrderDetail(ctx.workspace.id, id);
  if (!job) notFound();

  const customerLine = [job.customerName, job.customerPhone]
    .filter(Boolean)
    .join(" · ");
  const remaining = remainingDue(job.due, job.paid);
  const now = await requestNow();
  const printedAt = now.toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
  });
  const approvalUrl = job.publicToken
    ? approvalPageUrl(job.publicToken)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 bg-white px-2 py-4 print:max-w-none print:px-0 print:py-0">
      <style>{`
        @media print {
          html[data-print-format="thermal"] body {
            width: 80mm;
            margin: 0;
          }
          html[data-print-format="thermal"] .print-sheet {
            width: 72mm;
            max-width: 72mm;
            border: 0 !important;
            border-radius: 0 !important;
            padding: 0 !important;
            font-size: 11px;
            color: #000;
          }
          html[data-print-format="thermal"] .print-hide-thermal {
            display: none !important;
          }
          html[data-print-format="thermal"] .print-show-thermal {
            display: block !important;
          }
        }
        .print-show-thermal { display: none; }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm text-neutral-500 underline-offset-4 hover:underline"
        >
          İşe dön
        </Link>
        <PrintFormatToggle approvalUrl={approvalUrl} />
      </div>

      <article className="print-sheet rounded-2xl border border-neutral-200 p-6 print:rounded-none print:border-0 print:p-0">
        <header className="border-b border-neutral-200 pb-4">
          <p className="text-lg font-semibold tracking-tight text-neutral-950">
            {ctx.workspace.name}
          </p>
          {ctx.workspace.settings.phone ? (
            <p className="mt-1 text-sm text-neutral-500">
              Tel {ctx.workspace.settings.phone}
            </p>
          ) : null}
          <p className="mt-3 font-mono text-2xl tracking-wide text-neutral-950">
            {job.plate}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {STATUS_LABELS[job.status]}
            {job.displayNo ? ` · ${job.displayNo}` : null}
          </p>
          {job.entryKm != null ? (
            <p className="mt-1 text-sm text-neutral-600">
              Giriş KM: {job.entryKm.toLocaleString("tr-TR")}
            </p>
          ) : null}
          {customerLine ? (
            <p className="mt-1 text-sm text-neutral-500 print-hide-thermal">
              {customerLine}
            </p>
          ) : null}
        </header>

        {job.complaint ? (
          <section className="mt-4 print-hide-thermal">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Şikayet / not
            </h2>
            <p className="mt-1 text-sm text-neutral-800">{job.complaint}</p>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Kalemler
          </h2>
          {job.items.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">Kalem yok.</p>
          ) : (
            <table className="mt-2 w-full text-left text-sm">
              <thead className="print-hide-thermal">
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 font-medium">Tür</th>
                  <th className="py-2 font-medium">Açıklama</th>
                  <th className="py-2 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {job.items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-500 print-hide-thermal">
                      {KIND_LABELS[item.kind] ?? item.kind}
                    </td>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right font-medium">
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-6 grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Toplam</span>
            <span className="font-medium">{formatMoney(job.due)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Ödenen</span>
            <span>{formatMoney(job.paid)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2">
            <span className="font-medium">Kalan</span>
            <span className="font-semibold">{formatMoney(remaining)}</span>
          </div>
        </section>

        {job.payments.length > 0 ? (
          <section className="mt-6 print-hide-thermal">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Tahsilatlar
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {job.payments.map((payment) => (
                <li key={payment.id} className="flex justify-between gap-3">
                  <span className="text-neutral-500">
                    {METHOD_LABELS[payment.method] ?? payment.method}
                    {payment.voidedAt ? " (iptal)" : ""}
                  </span>
                  <span
                    className={
                      payment.voidedAt ? "line-through text-neutral-400" : ""
                    }
                  >
                    {formatMoney(payment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {approvalUrl ? (
          <section className="print-show-thermal mt-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(approvalUrl)}`}
              alt="Onay QR"
              width={96}
              height={96}
              className="mx-auto"
            />
            <p className="mt-2 text-[10px] text-neutral-600">Müşteri onay linki</p>
          </section>
        ) : null}

        <footer className="mt-8 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Yazdırma: {printedAt} · SanayiDesk
        </footer>
      </article>
    </div>
  );
}
