import { CounterStatusForm } from "@/components/desk/counter-status-form";
import { JobRow } from "@/components/desk/job-row";
import { EmptyState } from "@/components/ui/empty-state";
import { statusLabelFor, type TradeProfile } from "@/lib/trade/profile";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { BoardCard } from "@/lib/work-orders/types";
import {
  OPEN_STATUSES,
  STATUS_LABELS,
  type OpenWorkOrderStatus,
} from "@/lib/work-orders/status";
import { statusTone } from "@/lib/work-orders/status-tone";

export function BoardList({
  columns,
  profile,
  counterControls = false,
}: {
  columns: Record<OpenWorkOrderStatus, BoardCard[]>;
  profile: TradeProfile;
  counterControls?: boolean;
}) {
  const groups = OPEN_STATUSES.map((status) => ({
    status,
    label: statusLabelFor(profile.kind, status) || STATUS_LABELS[status],
    cards: columns[status] ?? [],
  })).filter((g) => g.cards.length > 0);

  if (groups.length === 0) {
    return (
      <EmptyState
        title={profile.labels.emptyToday}
        description="Yeni iş yukarıdaki Bugün ekranından açılır."
        actionHref="/today"
        actionLabel="Bugün"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.status} className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <span
              className={cn("h-1.5 w-6 rounded-full", statusTone(group.status).bar)}
              aria-hidden
            />
            {group.label}{" "}
            <span className="tabular-nums text-neutral-400">
              ({group.cards.length})
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {group.cards.map((card) => (
              <li key={card.id} className="flex flex-col gap-2">
                <JobRow
                  job={card}
                  tradeKind={profile.kind}
                  from="/board"
                  subtitle={card.customerName ?? undefined}
                />
                {counterControls &&
                (card.status === "intake" ||
                  card.status === "in_progress" ||
                  card.status === "ready") ? (
                  <div className={cn(surfaceCard, "px-4 py-3")}>
                    <CounterStatusForm
                      workOrderId={card.id}
                      status={card.status}
                      labels={profile.statusLabels}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
