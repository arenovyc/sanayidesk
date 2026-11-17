import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clearApprovalQuestionAction } from "@/app/(desk)/jobs/actions";
import { JobAssignPanel } from "@/components/desk/job-assign-panel";
import { JobDetailTabs } from "@/components/desk/job-detail-tabs";
import { JobDisTab } from "@/components/desk/job-dis-tab";
import { JobInventoryIssueForm } from "@/components/desk/inventory-forms";
import { JobMediaPanel } from "@/components/desk/job-media-form";
import {
  JobItemsSection,
  JobPartsSection,
  JobPaymentSection,
} from "@/components/desk/job-money-forms";
import { JobIntakeCompleteForm } from "@/components/desk/job-intake-complete-form";
import { JobStatusForm } from "@/components/desk/job-status-form";
import { QuoteApprovalButton } from "@/components/desk/quote-approval-button";
import { VehicleCheckupPanel } from "@/components/desk/vehicle-checkup";
import { WhatsAppShareButton } from "@/components/desk/whatsapp-share-button";
import { Button } from "@/components/ui/button";
import { RouteLoading } from "@/components/ui/skeleton";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import {
  waQuoteSummaryMessage,
  waReadyVehicleMessage,
} from "@/lib/format/wa-templates";
import { listAssignmentHistory } from "@/lib/data/assignments";
import { listInventoryItems } from "@/lib/data/inventory";
import { signedMediaUrls } from "@/lib/data/media-urls";
import { listDirectory, listTeam } from "@/lib/data/ops";
import { formatIstanbulDate } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import { getWorkOrderDetail } from "@/lib/data/work-orders";
import { requestNow } from "@/lib/time/request-now";
import { remainingDue } from "@/lib/work-orders/money";
import { STATUS_LABELS } from "@/lib/work-orders/status";

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

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ existing?: string }>;
}) {
  const ctx = await requireDeskSession();
  const { id } = await params;
  const query = await searchParams;
  const job = await getWorkOrderDetail(ctx.workspace.id, id);
  if (!job) notFound();

  const customerLine = [job.customerName, job.customerPhone]
    .filter(Boolean)
    .join(" · ");

  const [mediaUrls, team, historyRes, inventoryRes, directory] =
    await Promise.all([
      signedMediaUrls(job.media),
      listTeam(ctx.workspace.id),
      listAssignmentHistory(ctx.workspace.id, id),
      listInventoryItems(ctx.workspace.id),
      listDirectory(ctx.workspace.id),
    ]);

  const mechanics = team.filter(
    (member) => member.role === "mechanic" && member.isActive,
  );
  const active = historyRes.rows.find((row) => !row.unassignedAt) ?? null;
  const remaining = remainingDue(job.due, job.paid);
  const itemsTotal = job.items.reduce((sum, item) => sum + item.amount, 0);
  const hasItems = job.items.length > 0;
  const nextServiceKm =
    job.nextServiceKm ??
    (job.entryKm != null ? job.entryKm + 10000 : null);
  const now = await requestNow();
  const nextServiceDateLabel = (() => {
    const d = new Date(now.getTime());
    d.setMonth(d.getMonth() + 10);
    return formatIstanbulDate(d);
  })();
  const readyPreview = waReadyVehicleMessage({
    shopName: ctx.workspace.name,
    plate: job.plate,
    displayNo: job.displayNo,
    shopPhone: ctx.workspace.settings.phone,
    nextServiceKm,
    nextServiceDateLabel,
  });
  const quoteLabel = formatMoney(hasItems ? itemsTotal : 0);
  const quotePreview = waQuoteSummaryMessage({
    shopName: ctx.workspace.name,
    plate: job.plate,
    quoteLabel,
    shopPhone: ctx.workspace.settings.phone,
  });
  const needsIntakeComplete =
    !job.customerPhone ||
    !job.makeModel ||
    !job.complaint.trim() ||
    !job.customerName;
  const isOwner = ctx.membership.role === "owner";

  const summary = (
    <div>
      <p className="text-sm text-neutral-500">
        <Link href="/board" className="hover:underline">
          Tahta
        </Link>
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-mono text-2xl tracking-wide">{job.plate}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
            {job.displayNo ? (
              <span className="font-mono text-neutral-500">{job.displayNo}</span>
            ) : null}
            {job.makeModel ? <span>{job.makeModel}</span> : null}
            {job.entryKm != null ? (
              <span>{job.entryKm.toLocaleString("tr-TR")} km</span>
            ) : null}
            <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-xs font-medium text-neutral-800">
              {STATUS_LABELS[job.status]}
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
      {query.existing === "1" ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Bu plaka zaten içeride.
        </p>
      ) : null}
    </div>
  );

  const ozet = (
    <>
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

      {needsIntakeComplete ? (
        <JobIntakeCompleteForm
          workOrderId={job.id}
          fullName={job.customerName ?? ""}
          phone={job.customerPhone ?? ""}
          complaint={job.complaint}
          makeModel={job.makeModel ?? ""}
          entryKm={job.entryKm != null ? String(job.entryKm) : ""}
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
          {job.entryKm != null ? (
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-neutral-500">Giriş KM</dt>
              <dd>{job.entryKm.toLocaleString("tr-TR")}</dd>
            </div>
          ) : null}
          {job.complaint ? (
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="text-neutral-500">Şikayet</dt>
              <dd className="text-right">{job.complaint}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <VehicleCheckupPanel
        workOrderId={job.id}
        checkup={job.vehicleCheckup}
      />

      <JobAssignPanel
        workOrderId={job.id}
        mechanics={mechanics}
        currentMembershipId={active?.membershipId ?? null}
        history={historyRes.rows}
        schemaMissing={historyRes.schemaMissing}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Durum</h2>
        <JobStatusForm id={job.id} status={job.status} remaining={remaining} />
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

      <JobMediaPanel
        workOrderId={job.id}
        media={job.media}
        signedUrls={mediaUrls}
        schemaMissing={job.faz4SchemaMissing}
      />
    </>
  );

  const isParca = (
    <>
      <JobItemsSection workOrderId={job.id} items={job.items} />

      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-600">
          Fiyat onayı — durum &quot;Onay Bekliyor&quot; olur, WhatsApp + onay
          linki açılır. Tutar kalem toplamıdır.
        </p>
        {!hasItems ? (
          <p className="text-sm text-amber-800">
            Önce kalem ekle; aksi halde toplam ₺0 görünür.
          </p>
        ) : null}
        <QuoteApprovalButton
          workOrderId={job.id}
          preview={quotePreview}
          phone={job.customerPhone}
          shopName={ctx.workspace.name}
          plate={job.plate}
          quoteLabel={quoteLabel}
          shopPhone={ctx.workspace.settings.phone}
          disabled={
            !hasItems ||
            job.status === "delivered" ||
            job.status === "cancelled"
          }
        />
      </div>

      {!inventoryRes.schemaMissing ? (
        <JobInventoryIssueForm
          workOrderId={job.id}
          items={inventoryRes.rows}
        />
      ) : null}

      <JobPartsSection
        workOrderId={job.id}
        parts={job.parts}
        plate={job.plate}
        displayNo={job.displayNo}
        shopName={ctx.workspace.name}
        directory={directory}
      />
    </>
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

  const dis = (
    <Suspense fallback={<RouteLoading />}>
      <JobDisTab
        workspaceId={ctx.workspace.id}
        workOrderId={job.id}
        isOwner={isOwner}
      />
    </Suspense>
  );

  return (
    <JobDetailTabs
      summary={summary}
      panels={{
        ozet,
        is: isParca,
        tahsilat,
        dis,
      }}
    />
  );
}
