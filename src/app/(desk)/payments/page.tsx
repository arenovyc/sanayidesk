import Link from "next/link";
import { Banknote } from "lucide-react";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listRecentPayments } from "@/lib/data/work-orders";
import { formatMoney } from "@/lib/format/money";
import { workOrderLabel } from "@/lib/work-orders/display";

const METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale",
  credit: "Veresiye",
};

export default async function PaymentsPage() {
  const ctx = await requireDeskSession();
  const payments = await listRecentPayments(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tahsilat"
        description="Son ödemeler — iş emrine kalem ekleyip tahsil et."
      />
      {payments.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Henüz ödeme yok"
          description="İş emrine kalem ekleyip tahsil ettiğinde burada görünür."
          actionHref="/today"
          actionLabel="Bugün’e git"
        />
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {payments.map((payment) => {
            const voided = Boolean(payment.voidedAt);
            return (
              <li key={payment.id}>
                <Link
                  href={`/jobs/${payment.workOrderId}`}
                  className="flex items-center justify-between px-4 py-3.5 text-sm"
                >
                  <span>
                    <span
                      className={`${payment.plate ? "font-mono tracking-wide" : "font-medium"} ${voided ? "text-neutral-400 line-through" : ""}`}
                    >
                      {workOrderLabel({
                        plate: payment.plate ?? "",
                        counterTitle: payment.counterTitle ?? null,
                      })}
                    </span>
                    {payment.displayNo ? (
                      <span className="ml-2 font-mono text-xs text-neutral-400">
                        {payment.displayNo}
                      </span>
                    ) : null}
                    <span className="ml-2 text-neutral-400">
                      {METHOD_LABELS[payment.method] ?? payment.method}
                    </span>
                    {voided ? (
                      <span className="ml-2 text-red-600">İptal</span>
                    ) : null}
                  </span>
                  <span
                    className={`font-medium ${voided ? "text-neutral-400 line-through" : ""}`}
                  >
                    {formatMoney(payment.amount)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
