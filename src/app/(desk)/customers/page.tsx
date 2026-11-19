import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listCustomers } from "@/lib/data/customers";
import { Money } from "@/components/ui/money";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

export default function CustomersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
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
        <ul className="flex flex-col gap-2">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className={cn(
                  surfaceCard,
                  "flex min-h-14 items-center justify-between px-4 py-3.5 text-sm",
                )}
              >
                <span>
                  <span className="font-medium">{customer.fullName}</span>
                  {customer.phone ? (
                    <span className="ml-2 text-neutral-400">{customer.phone}</span>
                  ) : null}
                </span>
                <Money
                  amount={customer.balance}
                  tone={customer.balance > 0 ? "debt" : "muted"}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
