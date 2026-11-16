import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { BoardColumns } from "@/components/desk/board-columns";
import { JobSearch } from "@/components/desk/job-search";
import { PageHeader } from "@/components/shells/page-header";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listTeam } from "@/lib/data/ops";
import {
  getStatusBoard,
  searchWorkOrders,
} from "@/lib/data/work-orders";
import { boardColumnForStatus } from "@/lib/assignments/rules";
import { isWorkOrderStatus, STATUS_LABELS } from "@/lib/work-orders/status";

export default function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    assignee?: string;
    status?: string;
    unassigned?: string;
  }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BoardBody searchParams={searchParams} />
    </Suspense>
  );
}

async function BoardBody({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    assignee?: string;
    status?: string;
    unassigned?: string;
  }>;
}) {
  const ctx = await requireDeskSession();
  const query = await searchParams;
  const statusFilter =
    query.status && isWorkOrderStatus(query.status)
      ? boardColumnForStatus(query.status)
      : null;
  const unassigned = query.unassigned === "1";

  const [board, team, searchHits] = await Promise.all([
    getStatusBoard(ctx.workspace.id, {
      assignee: query.assignee ?? null,
      status: query.status ?? null,
      unassigned,
    }),
    listTeam(ctx.workspace.id),
    query.q ? searchWorkOrders(ctx.workspace.id, query.q) : Promise.resolve([]),
  ]);

  const mechanics = team.filter(
    (member) => member.role === "mechanic" && member.isActive,
  );

  const returnTo = (() => {
    const params = new URLSearchParams();
    if (query.assignee) params.set("assignee", query.assignee);
    if (query.status) params.set("status", query.status);
    if (unassigned) params.set("unassigned", "1");
    if (query.q) params.set("q", query.q);
    const qs = params.toString();
    return qs ? `/board?${qs}` : "/board";
  })();

  const hasFilter = Boolean(query.assignee || statusFilter || unassigned);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tahta"
        description="Sürükle = durum. Usta seçince kaydolur."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/board?unassigned=1"
              className="inline-flex h-8 items-center rounded-full border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Atanmamış
            </Link>
            <Link
              href="/load"
              className="inline-flex h-8 items-center rounded-full border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Yük
            </Link>
          </div>
        }
      />

      <JobSearch />

      {hasFilter ? (
        <p className="text-xs text-neutral-500">
          Filtre:{" "}
          {unassigned ? "atanmamış" : null}
          {unassigned && (statusFilter || query.assignee) ? " · " : null}
          {statusFilter ? STATUS_LABELS[statusFilter] : null}
          {statusFilter && query.assignee ? " · " : null}
          {query.assignee ? "usta seçili" : null}{" "}
          <Link href="/board" className="underline-offset-2 hover:underline">
            Temizle
          </Link>
        </p>
      ) : null}

      {query.q ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Arama</h2>
          {searchHits.length === 0 ? (
            <p className="text-sm text-neutral-400">Sonuç yok.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {searchHits.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-mono tracking-wide">{job.plate}</span>
                    <span className="text-neutral-500">
                      {job.displayNo ?? STATUS_LABELS[job.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <SchemaHintBanner missing={board.schemaMissing} quietProd />

      <BoardColumns
        columns={board.columns}
        mechanics={mechanics}
        returnTo={returnTo}
        highlightStatus={statusFilter}
      />
    </div>
  );
}
