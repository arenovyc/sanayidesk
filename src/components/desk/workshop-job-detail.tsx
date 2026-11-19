import { Suspense } from "react";
import Link from "next/link";
import { BackLink } from "@/components/shells/back-link";
import { JobDetailIsPanel } from "@/components/desk/job-detail-is-panel";
import { RemoveSampleJobBanner } from "@/components/desk/remove-sample-job-banner";
import { clearApprovalQuestionAction } from "@/app/(desk)/jobs/actions";
import { JobAssignPanel } from "@/components/desk/job-assign-panel";
import { JobDetailTabs } from "@/components/desk/job-detail-tabs";
import { JobDisTab } from "@/components/desk/job-dis-tab";
import { JobMediaPanel } from "@/components/desk/job-media-form";
import { JobPaymentSection } from "@/components/desk/job-money-forms";
import { JobIntakeCompleteForm } from "@/components/desk/job-intake-complete-form";
import { JobStatusForm } from "@/components/desk/job-status-form";
import { VehicleCheckupPanel } from "@/components/desk/vehicle-checkup";
import { WhatsAppShareButton } from "@/components/desk/whatsapp-share-button";
import { Button } from "@/components/ui/button";
import { RouteLoading } from "@/components/ui/skeleton";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import type { SessionContext } from "@/lib/auth/types";
import type { AssignmentHistoryRow } from "@/lib/data/assignments";
import type { TeamMember } from "@/lib/data/ops";
import {
  waQuoteSummaryMessage,
  waReadyVehicleMessage,
} from "@/lib/format/wa-templates";
import { formatMoney } from "@/lib/format/money";
import type { TradeProfile } from "@/lib/trade/profile";
import { remainingDue } from "@/lib/work-orders/money";
import { isSampleWorkOrder } from "@/lib/work-orders/is-sample";
import { workOrderLabel } from "@/lib/work-orders/display";
import type { WorkOrderDetail } from "@/lib/work-orders/types";

function ClearApprovalQuestionButton({ id }: { id: string }) {
  return (
    <form action={clearApprovalQuestionAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline">
        Okundu
      </Button>
    </form>
  );
}

export function WorkshopJobDetail({
  ctx,
  job,
  profile,
  mediaUrls,
  mechanics,
  historyRows,
  historySchemaMissing,
  activeMembershipId,
  nextServiceDateLabel,
  existing,
}: {
  ctx: SessionContext;
  job: WorkOrderDetail;
  profile: TradeProfile;
  mediaUrls: Record<string, string>;
  mechanics: TeamMember[];
  historyRows: AssignmentHistoryRow[];
  historySchemaMissing: boolean;
  activeMembershipId: string | null;
  nextServiceDateLabel: string;
  existing?: string;
}) {
  const customerLine = [job.customerName, job.customerPhone]
    .filter(Boolean)
    .join(" · ");
  const remaining = remainingDue(job.due, job.paid);
  const itemsTotal = job.items.reduce((sum, item) => sum + item.amount, 0);
  const hasItems = job.items.length > 0;
  const nextServiceKm =
    job.nextServiceKm ??
    (job.entryKm != null ? job.entryKm + 10000 : null);
  const sections = profile.jobDetail;
  const statusLabel =
    profile.statusLabels[job.status] ??
    ({
      intake: "Kabul",
      waiting_approval: "Onay Bekliyor",
      in_progress: "İçeride",
      waiting_parts: "Parça",
      ready: "Hazır",
      delivered: "Teslim",
      cancelled: "İptal",
    } as const)[job.status];

  const readyPreview = waReadyVehicleMessage({
    shopName: ctx.workspace.name,
    plate: job.plate,
    displayNo: job.displayNo,
    shopPhone: ctx.workspace.settings.phone,
    nextServiceKm: sections.remind ? nextServiceKm : null,
    nextServiceDateLabel: sections.remind ? nextServiceDateLabel : null,
  });
  const quotePreview = waQuoteSummaryMessage({
    shopName: ctx.workspace.name,
    plate: job.plate,
    quoteLabel: formatMoney(hasItems ? itemsTotal : 0),
    shopPhone: ctx.workspace.settings.phone,
  });

  const needsIntakeComplete =
    !job.customerPhone ||
    !job.makeModel ||
    !job.complaint.trim() ||
    !job.customerName;

  const isOwner = ctx.membership.role === "owner";
  const showSampleBanner = isSampleWorkOrder({
    complaint: job.complaint,
    customerName: job.customerName,
    status: job.status,
  });

  const mediaPanel = (
    <JobMediaPanel
      workOrderId={job.id}
      media={job.media}
      signedUrls={mediaUrls}
      schemaMissing={job.faz4SchemaMissing}
    />
  );

  const summary = (
    <div>
      <BackLink href="/today" label="Bugün" />
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-mono text-2xl tracking-wide">
            {workOrderLabel(job)}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
            {job.displayNo ? (
              <span className="font-mono text-neutral-500">{job.displayNo}</span>
            ) : null}
            {job.makeModel ? <span>{job.makeModel}</span> : null}
            {sections.entryKm && job.entryKm != null ? (
              <span>{job.entryKm.toLocaleString("tr-TR")} km</span>
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
      {existing === "1" ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Bu plaka zaten içeride.
        </p>
      ) : null}
    </div>
  );

  const ozet = (
    <>
      {showSampleBanner ? (
        <RemoveSampleJobBanner workOrderId={job.id} />
      ) : null}

      {job.status === "cancelled" ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
          <p>Bu iş iptal edildi ve Bugün listesinde görünmez.</p>
          <BackLink href="/today" label="Bugün'e dön" />
        </div>
      ) : null}

      <SchemaHintBanner missing={Boolean(job.opsSchemaMissing)} />

      {job.approvalQuestionAt && job.customerApprovalNote ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-950">
              Müşteri soru sordu
            </p>
            <p className="mt-1 text-sm text-amber-900">
              {job.customerApprovalNote}
            </p>
          </div>
          <ClearApprovalQuestionButton id={job.id} />
        </div>
      ) : null}

      {sections.mediaFirst ? mediaPanel : null}

      {needsIntakeComplete ? (
        <JobIntakeCompleteForm
          workOrderId={job.id}
          fullName={job.customerName ?? ""}
          phone={job.customerPhone ?? ""}
          complaint={job.complaint}
          makeModel={job.makeModel ?? ""}
          entryKm={job.entryKm != null ? String(job.entryKm) : ""}
          mode="workshop"
        />
      ) : (
        <dl className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm">
          <div className="flex justify-between gap-3 py-1.5">
            <dt className="text-neutral-500">Müşteri</dt>
            <dd>
              {job.customerId ? (
                <Link
                  href={`/customers/${job.customerId}`}
                  className="hover:underline"
                >
                  {customerLine || "Müşteri"}
                </Link>
              ) : (
                customerLine || "Walk-in"
              )}
            </dd>
          </div>
          {sections.entryKm && job.entryKm != null ? (
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-neutral-500">Giriş KM</dt>
              <dd>{job.entryKm.toLocaleString("tr-TR")}</dd>
            </div>
          ) : null}
          {job.complaint ? (
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-neutral-500">
                {sections.complaintFirst ? "Arıza / şikayet" : "Şikayet"}
              </dt>
              <dd className="text-right">{job.complaint}</dd>
            </div>
          ) : null}
        </dl>
      )}

      {sections.checkup ? (
        <VehicleCheckupPanel
          workOrderId={job.id}
          checkup={job.vehicleCheckup}
        />
      ) : null}

      <JobAssignPanel
        workOrderId={job.id}
        mechanics={mechanics}
        currentMembershipId={activeMembershipId}
        history={historyRows}
        schemaMissing={historySchemaMissing}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Durum</h2>
        <JobStatusForm
          id={job.id}
          status={job.status}
          remaining={remaining}
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
              ? "Araç hazır — müşteriye haber ver."
              : "Müşteriye WhatsApp mesajı."}
          </p>
          <WhatsAppShareButton
            workOrderId={job.id}
            preview={readyPreview}
            phone={job.customerPhone}
            label="Müşteriye WhatsApp — araç hazır"
            emphasized={job.status === "ready"}
          />
          <p className="mt-2 text-xs text-neutral-500">
            WhatsApp açılıp mesajı sen gönderirsin. Otomatik API yok.
          </p>
        </div>
      ) : null}

      {!sections.mediaFirst ? mediaPanel : null}
    </>
  );

  return (
    <JobDetailTabs
      summary={summary}
      panels={{
        ozet,
        is: (
          <Suspense fallback={<RouteLoading />}>
            <JobDetailIsPanel
              workspaceId={ctx.workspace.id}
              job={job}
              shopName={ctx.workspace.name}
              shopPhone={ctx.workspace.settings.phone}
              quotePreview={quotePreview}
            />
          </Suspense>
        ),
        tahsilat: (
          <JobPaymentSection
            workOrderId={job.id}
            payments={job.payments}
            due={job.due}
            paid={job.paid}
            isOwner={isOwner}
          />
        ),
        dis: (
          <Suspense fallback={<RouteLoading />}>
            <JobDisTab
              workspaceId={ctx.workspace.id}
              workOrderId={job.id}
              isOwner={isOwner}
            />
          </Suspense>
        ),
      }}
    />
  );
}
