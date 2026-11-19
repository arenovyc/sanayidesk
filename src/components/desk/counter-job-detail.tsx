import { Suspense } from "react";
import Link from "next/link";
import { BackLink } from "@/components/shells/back-link";
import { JobDetailIsPanel } from "@/components/desk/job-detail-is-panel";
import { JobDetailTabs } from "@/components/desk/job-detail-tabs";
import { JobPaymentSection } from "@/components/desk/job-money-forms";
import { JobIntakeCompleteForm } from "@/components/desk/job-intake-complete-form";
import { CounterStatusForm } from "@/components/desk/counter-status-form";
import { WhatsAppShareButton } from "@/components/desk/whatsapp-share-button";
import { Button } from "@/components/ui/button";
import { RouteLoading } from "@/components/ui/skeleton";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import type { SessionContext } from "@/lib/auth/types";
import {
  waQuoteSummaryMessage,
  waReadyVehicleMessage,
} from "@/lib/format/wa-templates";
import { formatMoney } from "@/lib/format/money";
import type { TradeProfile } from "@/lib/trade/profile";
import { remainingDue } from "@/lib/work-orders/money";
import { workOrderLabel } from "@/lib/work-orders/display";
import type { WorkOrderDetail } from "@/lib/work-orders/types";

export function CounterJobDetail({
  ctx,
  job,
  profile,
}: {
  ctx: SessionContext;
  job: WorkOrderDetail;
  profile: TradeProfile;
}) {
  const customerLine = [job.customerName, job.customerPhone]
    .filter(Boolean)
    .join(" · ");
  const remaining = remainingDue(job.due, job.paid);
  const itemsTotal = job.items.reduce((sum, item) => sum + item.amount, 0);
  const hasItems = job.items.length > 0;
  const label = workOrderLabel(job);
  const statusLabel =
    profile.statusLabels[job.status] ??
    ({
      intake: "Hazırlanıyor",
      in_progress: "Hazırlanıyor",
      ready: "Hazır",
      delivered: "Teslim",
      cancelled: "İptal",
      waiting_approval: "Onay",
      waiting_parts: "Beklemede",
    } as const)[job.status];

  const readyPreview = waReadyVehicleMessage({
    shopName: ctx.workspace.name,
    title: label,
    plate: job.plate || null,
    displayNo: job.displayNo,
    shopPhone: ctx.workspace.settings.phone,
    readyNoun: profile.kind === "torna" ? "job" : "order",
  });
  const quotePreview = waQuoteSummaryMessage({
    shopName: ctx.workspace.name,
    title: label,
    plate: job.plate || null,
    quoteLabel: formatMoney(hasItems ? itemsTotal : 0),
    shopPhone: ctx.workspace.settings.phone,
  });

  const needsIntake =
    !job.customerName?.trim() && !job.customerPhone?.trim();

  const isOwner = ctx.membership.role === "owner";

  const summary = (
    <div>
      <BackLink href="/today" label="Bugün" />
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
            {label}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
            {job.displayNo ? (
              <span className="font-mono text-neutral-500">{job.displayNo}</span>
            ) : null}
            <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-xs font-medium text-neutral-800">
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Toplam {formatMoney(job.due)} · Kalan{" "}
            <span className="font-semibold text-neutral-800">
              {formatMoney(remaining)}
            </span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/jobs/${job.id}/print`}>Yazdır / PDF</Link>
        </Button>
      </div>
    </div>
  );

  const ozet = (
    <>
      {job.status === "cancelled" ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
          <p>Bu {profile.labels.jobNoun.toLowerCase()} iptal edildi.</p>
          <BackLink href="/today" label="Bugün'e dön" />
        </div>
      ) : null}

      <SchemaHintBanner missing={Boolean(job.opsSchemaMissing)} />

      {needsIntake ? (
        <JobIntakeCompleteForm
          workOrderId={job.id}
          fullName={job.customerName ?? ""}
          phone={job.customerPhone ?? ""}
          complaint={job.complaint}
          makeModel=""
          mode="counter"
        />
      ) : (
        <dl className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm">
          <div className="flex justify-between gap-3 py-1.5">
            <dt className="text-neutral-500">{profile.labels.customerNoun}</dt>
            <dd>
              {job.customerId ? (
                <Link
                  href={`/customers/${job.customerId}`}
                  className="hover:underline"
                >
                  {customerLine || "—"}
                </Link>
              ) : (
                customerLine || "—"
              )}
            </dd>
          </div>
          {job.complaint ? (
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-neutral-500">Not</dt>
              <dd className="text-right">{job.complaint}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Durum</h2>
        <CounterStatusForm
          workOrderId={job.id}
          status={job.status}
          labels={profile.statusLabels}
        />
      </section>

      {job.customerPhone ? (
        <div
          className={
            job.status === "ready"
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              : "rounded-2xl border border-neutral-200 bg-white p-4"
          }
        >
          <p className="mb-2 text-sm text-neutral-600">
            {job.status === "ready"
              ? profile.kind === "torna"
                ? "İş hazır — gönderene haber ver."
                : "Sipariş hazır — müşteriye haber ver."
              : "WhatsApp mesajı."}
          </p>
          <WhatsAppShareButton
            workOrderId={job.id}
            preview={readyPreview}
            phone={job.customerPhone}
            label={
              profile.kind === "torna"
                ? "WhatsApp — iş hazır"
                : "WhatsApp — sipariş hazır"
            }
            emphasized={job.status === "ready"}
          />
        </div>
      ) : null}
    </>
  );

  const isParca = (
    <Suspense fallback={<RouteLoading />}>
      <JobDetailIsPanel
        workspaceId={ctx.workspace.id}
        job={job}
        shopName={ctx.workspace.name}
        shopPhone={ctx.workspace.settings.phone}
        quotePreview={quotePreview}
      />
    </Suspense>
  );

  const tahsilat = (
    <JobPaymentSection
      workOrderId={job.id}
      payments={job.payments}
      due={job.due}
      paid={job.paid}
      isOwner={isOwner}
    />
  );

  return (
    <JobDetailTabs
      summary={summary}
      panels={{
        ozet,
        is: isParca,
        tahsilat,
        dis: (
          <p className="text-sm text-neutral-500">
            Tezgâh işlerinde dış iş sekmesi kullanılmaz.
          </p>
        ),
      }}
    />
  );
}
