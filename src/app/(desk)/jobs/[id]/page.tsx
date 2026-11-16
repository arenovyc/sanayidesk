import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobB2bPanel } from "@/components/desk/b2b-forms";
import { JobAssignPanel } from "@/components/desk/job-assign-panel";
import { JobBonusPanel } from "@/components/desk/job-bonus-form";
import { JobInventoryIssueForm } from "@/components/desk/inventory-forms";
import { JobMediaPanel } from "@/components/desk/job-media-form";
import { JobMoneyPanel } from "@/components/desk/job-money-forms";
import { JobIntakeCompleteForm } from "@/components/desk/job-intake-complete-form";
import { JobQuoteForm } from "@/components/desk/job-quote-form";
import { JobStatusForm } from "@/components/desk/job-status-form";
import { QuoteApprovalButton } from "@/components/desk/quote-approval-button";
import { WhatsAppShareButton } from "@/components/desk/whatsapp-share-button";
import { Button } from "@/components/ui/button";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import {
  waQuoteSummaryMessage,
  waReadyVehicleMessage,
} from "@/lib/format/wa-templates";
import {
  listAssignmentHistory,
} from "@/lib/data/assignments";
import {
  listB2bEntriesForWorkOrder,
  listExternalParties,
} from "@/lib/data/b2b";
import { listBonusesForWorkOrder } from "@/lib/data/bonuses";
import { listInventoryItems } from "@/lib/data/inventory";
import { signedMediaUrls } from "@/lib/data/media-urls";
import { listDirectory, listTeam } from "@/lib/data/ops";
import { formatMoney } from "@/lib/format/money";
import { getWorkOrderDetail } from "@/lib/data/work-orders";
import { remainingDue } from "@/lib/work-orders/money";
import { STATUS_LABELS } from "@/lib/work-orders/status";

export default function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ existing?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <JobDetailBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function JobDetailBody({
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

  const customerLine = [job.customerName, job.customerPhone].filter(Boolean).join(" · ");
  const mediaUrls = await signedMediaUrls(job.media);
  const [partiesRes, jobB2bRes, directory, team, historyRes, bonusesRes, inventoryRes] =
    await Promise.all([
      listExternalParties(ctx.workspace.id),
      listB2bEntriesForWorkOrder(ctx.workspace.id, id),
      listDirectory(ctx.workspace.id),
      listTeam(ctx.workspace.id),
      listAssignmentHistory(ctx.workspace.id, id),
      listBonusesForWorkOrder(ctx.workspace.id, id),
      listInventoryItems(ctx.workspace.id),
    ]);

  const mechanics = team.filter(
    (member) => member.role === "mechanic" && member.isActive,
  );
  const active = historyRes.rows.find((row) => !row.unassignedAt) ?? null;
  const remaining = remainingDue(job.due, job.paid);
  const readyPreview = waReadyVehicleMessage({
    shopName: ctx.workspace.name,
    plate: job.plate,
    displayNo: job.displayNo,
    shopPhone: ctx.workspace.settings.phone,
  });
  const quotePreview = waQuoteSummaryMessage({
    shopName: ctx.workspace.name,
    plate: job.plate,
    quoteLabel: formatMoney(job.quoteAmount ?? job.due),
    shopPhone: ctx.workspace.settings.phone,
  });
  const needsIntakeComplete =
    !job.customerPhone ||
    !job.makeModel ||
    !job.complaint.trim() ||
    !job.customerName;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/board" className="hover:underline">
            Tahta
          </Link>
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl tracking-wide">{job.plate}</h1>
            {job.displayNo ? (
              <p className="mt-1 font-mono text-sm text-neutral-500">
                {job.displayNo}
              </p>
            ) : null}
            {job.makeModel ? (
              <p className="mt-1 text-sm text-neutral-600">{job.makeModel}</p>
            ) : null}
            <p className="mt-1 text-sm text-neutral-600">
              {STATUS_LABELS[job.status]}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Toplam {formatMoney(job.due)} · Kalan {formatMoney(remaining)}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/jobs/${job.id}/print`}>Yazdır / PDF</Link>
          </Button>
        </div>
      </div>

      {query.existing === "1" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Bu plaka zaten içeride.
        </p>
      ) : null}

      {needsIntakeComplete ? (
        <JobIntakeCompleteForm
          workOrderId={job.id}
          fullName={job.customerName ?? ""}
          phone={job.customerPhone ?? ""}
          complaint={job.complaint}
          makeModel={job.makeModel ?? ""}
        />
      ) : null}

      <SchemaHintBanner missing={Boolean(job.opsSchemaMissing)} />

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-600">
          Fiyat onayı — durum &quot;Onay Bekliyor&quot; olur, WhatsApp açılır.
        </p>
        <QuoteApprovalButton
          workOrderId={job.id}
          preview={quotePreview}
          phone={job.customerPhone}
          disabled={job.status === "delivered" || job.status === "cancelled"}
        />
      </div>

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
            WhatsApp açılır; mesajı sen gönderirsin. Otomatik API yok.
          </p>
        </div>
      ) : null}

      <JobQuoteForm workOrderId={job.id} quoteAmount={job.quoteAmount} />

      <dl className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm">
        <div className="flex justify-between gap-3 py-1.5">
          <dt className="text-neutral-500">Müşteri</dt>
          <dd>
            {job.customerId ? (
              <Link href={`/customers/${job.customerId}`} className="hover:underline">
                {customerLine || "Müşteri"}
              </Link>
            ) : (
              customerLine || "Walk-in"
            )}
          </dd>
        </div>
        {job.complaint ? (
          <div className="flex justify-between gap-3 py-1.5">
            <dt className="text-neutral-500">Şikayet</dt>
            <dd className="text-right">{job.complaint}</dd>
          </div>
        ) : null}
      </dl>

      <JobAssignPanel
        workOrderId={job.id}
        mechanics={mechanics}
        currentMembershipId={active?.membershipId ?? null}
        history={historyRes.rows}
        schemaMissing={historyRes.schemaMissing}
      />

      <JobStatusForm id={job.id} status={job.status} remaining={remaining} />

      <JobMediaPanel
        workOrderId={job.id}
        media={job.media}
        signedUrls={mediaUrls}
        schemaMissing={job.faz4SchemaMissing}
      />

      <JobMoneyPanel
        shopName={ctx.workspace.name}
        workOrderId={job.id}
        items={job.items}
        payments={job.payments}
        parts={job.parts}
        due={job.due}
        paid={job.paid}
        plate={job.plate}
        displayNo={job.displayNo}
        directory={directory}
        isOwner={ctx.membership.role === "owner"}
      />

      {!inventoryRes.schemaMissing ? (
        <JobInventoryIssueForm
          workOrderId={job.id}
          items={inventoryRes.rows}
        />
      ) : null}

      <JobBonusPanel
        workOrderId={job.id}
        mechanics={mechanics}
        bonuses={bonusesRes.rows}
        isOwner={ctx.membership.role === "owner"}
        schemaMissing={bonusesRes.schemaMissing}
      />

      <JobB2bPanel
        workOrderId={job.id}
        parties={partiesRes.rows}
        entries={jobB2bRes.rows}
        isOwner={ctx.membership.role === "owner"}
        schemaMissing={partiesRes.schemaMissing || jobB2bRes.schemaMissing}
      />
    </div>
  );
}
