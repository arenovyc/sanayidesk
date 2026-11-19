import { Suspense } from "react";
import { notFound } from "next/navigation";
import { StaffMediaForm } from "@/components/lift/staff-media-form";
import { StaffPartsRequestForm } from "@/components/lift/staff-parts-request-form";
import { StaffStatusForm } from "@/components/lift/staff-status-form";
import { StaffWhatsAppShare } from "@/components/lift/staff-whatsapp-share";
import { BackLink } from "@/components/shells/back-link";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { PageSkeleton } from "@/components/ui/skeleton";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireLiftSession } from "@/lib/auth/get-membership";
import { listStaffJobMedia } from "@/lib/data/staff-media";
import { getStaffJob, listOpenParts } from "@/lib/data/staff-work";
import { waPartsVendorMessage } from "@/lib/format/wa-templates";

export default function LiftJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LiftJobBody params={params} />
    </Suspense>
  );
}

async function LiftJobBody({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireLiftSession();
  const { id } = await params;
  const job = await getStaffJob(id);
  if (!job) notFound();

  const [{ media, urls, schemaMissing }, parts] = await Promise.all([
    listStaffJobMedia(ctx.workspace.id, id),
    listOpenParts(),
  ]);
  const jobParts = parts.filter((part) => part.workOrderId === id);
  const sharePlain = waPartsVendorMessage({
    shopName: ctx.workspace.name,
    plate: job.displayNo ? `${job.displayNo} ${job.plate}` : job.plate,
    partsPlain: jobParts.map((p) => p.description).join(", ") || "—",
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <BackLink href="/lift" label="Liftim" />
        <h1 className="mt-2">
          <LicensePlateBadge plate={job.plate} size="lg" />
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={job.status} />
          {job.displayNo ? (
            <span className="font-mono text-sm tabular-nums text-neutral-500">
              {job.displayNo}
            </span>
          ) : null}
        </div>
        {job.assigneeName ? (
          <p className="mt-1 text-sm text-neutral-500">Usta: {job.assigneeName}</p>
        ) : null}
        {job.complaint ? (
          <p className="mt-2 text-sm text-neutral-500">{job.complaint}</p>
        ) : null}
      </div>

      <StaffPartsRequestForm workOrderId={job.id} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Açık parçalar</h2>
          {jobParts.length > 0 ? (
            <StaffWhatsAppShare workOrderId={job.id} preview={sharePlain} />
          ) : null}
        </div>
        {jobParts.length === 0 ? (
          <p className="text-sm text-neutral-400">Açık parça yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {jobParts.map((part) => (
              <li key={part.id} className="flex justify-between px-4 py-3 text-sm">
                <span>{part.description}</span>
                <span className="text-neutral-400">{part.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {schemaMissing ? (
        <SchemaHintBanner missing />
      ) : (
        <>
          {media.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2">
              {media.map((item) => (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
                >
                  {urls[item.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[item.id]}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <StaffMediaForm workOrderId={job.id} />
        </>
      )}

      <StaffStatusForm id={job.id} status={job.status} />
    </div>
  );
}
