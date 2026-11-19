import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shells/page-header";
import { notFound } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { getCustomer } from "@/lib/data/customers";
import { JobRow } from "@/components/desk/job-row";
import { Money } from "@/components/ui/money";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format/money";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
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
      <PageHeader
        title={customer.fullName}
        backHref="/customers"
        backLabel="Müşteriler"
        description={customer.phone ?? undefined}
      />
      <div>
        <p className="mt-2 text-sm">
          Bakiye{" "}
          <Money
            amount={customer.balance}
            tone={customer.balance > 0 ? "debt" : "default"}
          />
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">İşler</h2>
        {customer.jobs.length === 0 ? (
          <p className="text-sm text-neutral-400">İş yok.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customer.jobs.map((job) => (
              <li key={job.id}>
                <JobRow job={job} from={`/customers/${customer.id}`} />
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
