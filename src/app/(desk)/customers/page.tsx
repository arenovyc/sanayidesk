import { Suspense } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listCustomers } from "@/lib/data/customers";
import { formatMoney } from "@/lib/format/money";

export default function CustomersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <CustomersBody />
    </Suspense>
  );
}

async function CustomersBody() {
  const ctx = await requireDeskSession();
  const customers = await listCustomers(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Müşteriler"
        backHref="/more"
        backLabel="Daha fazla"
        description="Kabulde ad veya telefon girince oluşur."
      />
      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Kayıtlı müşteri yok"
          description="Kabulde ad veya telefon girince burada listelenir."
          actionHref="/today"
          actionLabel="Araç kabul et"
        />
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="flex items-center justify-between px-4 py-3.5 text-sm"
              >
                <span>
                  <span className="font-medium">{customer.fullName}</span>
                  {customer.phone ? (
                    <span className="ml-2 text-neutral-400">{customer.phone}</span>
                  ) : null}
                </span>
                <span className={customer.balance > 0 ? "text-red-700" : "text-neutral-500"}>
                  {formatMoney(customer.balance)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
