import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { getCustomer } from "@/lib/data/customers";
import { formatMoney } from "@/lib/format/money";
import { STATUS_LABELS } from "@/lib/work-orders/status";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <CustomerBody params={params} />
    </Suspense>
  );
}

async function CustomerBody({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireDeskSession();
  const { id } = await params;
  const customer = await getCustomer(ctx.workspace.id, id);
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/customers" className="hover:underline">
            Müşteriler
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold">{customer.fullName}</h1>
        {customer.phone ? (
          <p className="text-sm text-neutral-500">{customer.phone}</p>
        ) : null}
        <p className="mt-2 text-sm">
          Bakiye{" "}
          <span className={customer.balance > 0 ? "font-semibold text-red-700" : "font-semibold"}>
            {formatMoney(customer.balance)}
          </span>
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">İşler</h2>
        {customer.jobs.length === 0 ? (
          <p className="text-sm text-neutral-400">İş yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {customer.jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex justify-between px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-mono tracking-wide">{job.plate}</span>
                    {job.displayNo ? (
                      <span className="ml-2 font-mono text-xs text-neutral-500">
                        {job.displayNo}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-neutral-500">{STATUS_LABELS[job.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Cari</h2>
        <p className="text-xs text-neutral-500">
          Pozitif tutar borç artışı; negatif tutar ödeme veya azalış.
        </p>
        {customer.ledger.length === 0 ? (
          <p className="text-sm text-neutral-400">Hareket yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {customer.ledger.map((entry) => (
              <li key={entry.id} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-neutral-500">
                  {entry.note ||
                    (entry.delta > 0 ? "Borç artışı" : "Ödeme / azalış")}
                </span>
                <span className={entry.delta > 0 ? "text-red-700" : ""}>
                  {formatMoney(entry.delta)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
