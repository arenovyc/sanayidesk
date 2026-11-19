import Link from "next/link";
import { Banknote } from "lucide-react";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { Money } from "@/components/ui/money";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listRecentPayments } from "@/lib/data/work-orders";
import { formatIstanbulDate } from "@/lib/format/date";
import { requestNow } from "@/lib/time/request-now";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { workOrderLabel } from "@/lib/work-orders/display";
import { isActivePayment } from "@/lib/work-orders/money";

const METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale",
  credit: "Veresiye",
};

export default async function PaymentsPage() {
  const ctx = await requireDeskSession();
  const [payments, now] = await Promise.all([
    listRecentPayments(ctx.workspace.id),
    requestNow(),
  ]);
  const todayLabel = formatIstanbulDate(now);
  const active = payments.filter((payment) => isActivePayment(payment));
  const todayTotal = active
    .filter(
      (payment) =>
        payment.method !== "credit" &&
        formatIstanbulDate(new Date(payment.paidAt)) === todayLabel,
    )
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tahsilat"
        description="Son ödemeler — iş emrinden Tahsilat sekmesine gir."
      />
      {payments.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Bugün henüz tahsilat yok"
          description="İşten Tahsilat sekmesine gir, nakit veya kart kaydet."
          actionHref="/today"
          actionLabel="Bugün’e git"
        />
      ) : (
        <>
          <div className={cn(surfaceCard, "px-4 py-3")}>
            <p className="text-xs text-neutral-500">Bugün tahsil (nakit/kart/havale)</p>
            <p className="mt-1 text-2xl font-semibold">
              <Money amount={todayTotal} />
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {payments.map((payment) => {
              const voided = Boolean(payment.voidedAt);
              const label = workOrderLabel({
                plate: payment.plate ?? "",
                counterTitle: payment.counterTitle ?? null,
              });
              const plate = payment.plate && !payment.counterTitle;
              return (
                <li key={payment.id}>
                  <Link
                    href={`/jobs/${payment.workOrderId}?from=${encodeURIComponent("/payments")}`}
                    className={cn(
                      surfaceCard,
                      "flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-sm",
                    )}
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      {plate ? (
                        <LicensePlateBadge plate={payment.plate ?? ""} size="sm" />
                      ) : (
                        <span
                          className={cn(
                            "truncate font-medium",
                            voided && "text-neutral-400 line-through",
                          )}
                        >
                          {label}
                        </span>
                      )}
                      <span className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        {payment.displayNo ? (
                          <span className="font-mono tabular-nums">
                            {payment.displayNo}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
                          {METHOD_LABELS[payment.method] ?? payment.method}
                        </span>
                        {voided ? (
                          <span className="text-red-600">İptal</span>
                        ) : null}
                      </span>
                    </span>
                    <Money
                      amount={payment.amount}
                      tone={voided ? "muted" : "default"}
                      className={voided ? "line-through" : "font-medium"}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
