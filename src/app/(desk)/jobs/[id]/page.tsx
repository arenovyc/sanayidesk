import { notFound } from "next/navigation";
import { CounterJobDetail } from "@/components/desk/counter-job-detail";
import { WorkshopJobDetail } from "@/components/desk/workshop-job-detail";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listAssignmentHistory } from "@/lib/data/assignments";
import { signedMediaUrls } from "@/lib/data/media-urls";
import { listTeam } from "@/lib/data/ops";
import { getWorkOrderDetail } from "@/lib/data/work-orders";
import { formatIstanbulDate } from "@/lib/format/date";
import { requestNow } from "@/lib/time/request-now";
import { isCounterTrade } from "@/lib/trade/kinds";
import { getTradeProfile } from "@/lib/trade/profile";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ existing?: string; tab?: string }>;
}) {
  const ctx = await requireDeskSession();
  const { id } = await params;
  const query = await searchParams;
  const job = await getWorkOrderDetail(ctx.workspace.id, id);
  if (!job) notFound();

  const profile = getTradeProfile(ctx.workspace.tradeKind);

  if (isCounterTrade(ctx.workspace.tradeKind) || Boolean(job.counterTitle)) {
    return <CounterJobDetail ctx={ctx} job={job} profile={profile} />;
  }

  const [mediaUrls, team, historyRes] = await Promise.all([
    signedMediaUrls(job.media),
    listTeam(ctx.workspace.id),
    listAssignmentHistory(ctx.workspace.id, id),
  ]);

  const mechanics = team.filter(
    (member) => member.role === "mechanic" && member.isActive,
  );
  const active = historyRes.rows.find((row) => !row.unassignedAt) ?? null;
  const now = await requestNow();
  const nextServiceDateLabel = (() => {
    const d = new Date(now.getTime());
    d.setMonth(d.getMonth() + 10);
    return formatIstanbulDate(d);
  })();

  return (
    <WorkshopJobDetail
      ctx={ctx}
      job={job}
      profile={profile}
      mediaUrls={mediaUrls}
      mechanics={mechanics}
      historyRows={historyRes.rows}
      historySchemaMissing={historyRes.schemaMissing}
      activeMembershipId={active?.membershipId ?? null}
      nextServiceDateLabel={nextServiceDateLabel}
      existing={query.existing}
    />
  );
}
