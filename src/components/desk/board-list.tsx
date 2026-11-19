import Link from "next/link";
import { CounterStatusForm } from "@/components/desk/counter-status-form";
import { workOrderLabel } from "@/lib/work-orders/display";
import type { BoardCard } from "@/lib/work-orders/types";
import {
  OPEN_STATUSES,
  type OpenWorkOrderStatus,
} from "@/lib/work-orders/status";
import type { TradeProfile } from "@/lib/trade/profile";

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
    label: profile.statusLabels[status] ?? status,
    cards: columns[status] ?? [],
  })).filter((g) => g.cards.length > 0);

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
        {profile.labels.emptyToday}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.status} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">
            {group.label}{" "}
            <span className="text-neutral-400">({group.cards.length})</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {group.cards.map((card) => (
              <li
                key={card.id}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
              >
                <Link
                  href={`/jobs/${card.id}`}
                  className="font-medium hover:underline"
                >
                  {workOrderLabel(card)}
                </Link>
                {card.customerName ? (
                  <p className="text-xs text-neutral-500">{card.customerName}</p>
                ) : null}
                {counterControls &&
                (card.status === "intake" ||
                  card.status === "in_progress" ||
                  card.status === "ready") ? (
                  <div className="mt-2">
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
