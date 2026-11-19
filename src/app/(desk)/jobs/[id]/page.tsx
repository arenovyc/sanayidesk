import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CounterJobDetail } from "@/components/desk/counter-job-detail";
import {
  JobAssignSection,
  JobMediaSection,
} from "@/components/desk/job-detail-secondary";
import { WorkshopJobDetail } from "@/components/desk/workshop-job-detail";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listTeam } from "@/lib/data/ops";
import { getWorkOrderDetail } from "@/lib/data/work-orders";
import { formatIstanbulDate } from "@/lib/format/date";
import { requestNow } from "@/lib/time/request-now";
import { isCounterTrade } from "@/lib/trade/kinds";
import { getTradeProfile } from "@/lib/trade/profile";

function SecondaryFallback() {
  return (
    <div className="h-24 animate-pulse rounded-2xl border border-neutral-200/80 bg-neutral-100/80" />
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ existing?: string; tab?: string; from?: string }>;
}) {
  const ctx = await requireDeskSession();
  const { id } = await params;
  const query = await searchParams;
  const counterTrade = isCounterTrade(ctx.workspace.tradeKind);
  const [job, team, now] = await Promise.all([
    getWorkOrderDetail(ctx.workspace.id, id),
    counterTrade
      ? Promise.resolve([] as Awaited<ReturnType<typeof listTeam>>)
      : listTeam(ctx.workspace.id),
    requestNow(),
  ]);
  if (!job) notFound();

  const profile = getTradeProfile(ctx.workspace.tradeKind);

  if (counterTrade || Boolean(job.counterTitle)) {
    return (
      <CounterJobDetail
        ctx={ctx}
        job={job}
        profile={profile}
        from={query.from}
      />
    );
  }

  const mechanics = team.filter(
    (member) => member.role === "mechanic" && member.isActive,
  );
  const nextServiceDateLabel = (() => {
    const d = new Date(now.getTime());
    d.setMonth(d.getMonth() + 10);
    return formatIstanbulDate(d);
  })();

  const mediaSection = (
    <Suspense fallback={<SecondaryFallback />}>
      <JobMediaSection
        workOrderId={job.id}
        media={job.media}
        schemaMissing={job.faz4SchemaMissing}
      />
    </Suspense>
  );
  const assignSection = (
    <Suspense fallback={<SecondaryFallback />}>
      <JobAssignSection
        workspaceId={ctx.workspace.id}
        workOrderId={job.id}
        mechanics={mechanics}
      />
    </Suspense>
  );

  return (
    <WorkshopJobDetail
      ctx={ctx}
      job={job}
      profile={profile}
      mediaSection={mediaSection}
      assignSection={assignSection}
      nextServiceDateLabel={nextServiceDateLabel}
      existing={query.existing}
      from={query.from}
    />
  );
}
