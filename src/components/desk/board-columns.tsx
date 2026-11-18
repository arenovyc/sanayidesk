"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setWorkOrderStatusAction } from "@/app/(desk)/jobs/actions";
import { AssignForm } from "@/components/desk/assign-form";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format/money";
import { truncateComplaint } from "@/lib/format/wait-label";
import type { TeamMember } from "@/lib/data/ops";
import { statusForBoardDrop } from "@/lib/work-orders/board-drop";
import { workOrderLabel } from "@/lib/work-orders/display";
import type { BoardCard } from "@/lib/work-orders/types";
import {
  OPEN_STATUSES,
  STATUS_LABELS,
  type OpenWorkOrderStatus,
  type WorkOrderStatus,
} from "@/lib/work-orders/status";

type DropPayload = {
  id: string;
  status: string;
  remaining: number;
};

type PendingDrop = {
  id: string;
  next: OpenWorkOrderStatus;
  remaining: number;
};

export function BoardColumns({
  columns,
  mechanics,
  returnTo,
  highlightStatus,
}: {
  columns: Record<OpenWorkOrderStatus, BoardCard[]>;
  mechanics: TeamMember[];
  returnTo: string;
  highlightStatus?: OpenWorkOrderStatus | null;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDrop, setConfirmDrop] = useState<PendingDrop | null>(null);

  const visible = highlightStatus
    ? OPEN_STATUSES.filter((status) => status === highlightStatus)
    : OPEN_STATUSES;

  function applyStatus(
    id: string,
    next: WorkOrderStatus,
    allowUnpaid = false,
  ) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", next);
    fd.set("returnTo", returnTo);
    if (allowUnpaid) fd.set("allowUnpaid", "1");
    startTransition(async () => {
      await setWorkOrderStatusAction({ error: null }, fd);
    });
  }

  function handleDrop(targetStatus: OpenWorkOrderStatus, raw: string) {
    let payload: DropPayload;
    try {
      payload = JSON.parse(raw) as DropPayload;
    } catch {
      return;
    }
    const next = statusForBoardDrop(
      payload.status as BoardCard["status"],
      targetStatus,
    );
    if (!next) return;
    if (next === "ready" && payload.remaining > 0) {
      setConfirmDrop({
        id: payload.id,
        next,
        remaining: payload.remaining,
      });
      return;
    }
    applyStatus(payload.id, next);
  }

  return (
    <div className="flex flex-col gap-3">
      {confirmDrop ? (
        <div
          role="dialog"
          aria-modal="true"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm text-amber-950">
            Bu işin {formatMoney(confirmDrop.remaining)} kalan ödemesi var.
            Tahsilat almadan müşteri carisine (veresiye) borç yazarak devam
            etmek istiyor musun?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmDrop(null)}
            >
              İptal
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                const drop = confirmDrop;
                setConfirmDrop(null);
                applyStatus(drop.id, drop.next, true);
              }}
            >
              Veresiye devam
            </Button>
          </div>
        </div>
      ) : null}

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:gap-2.5 lg:overflow-x-visible lg:px-0 xl:gap-3">
        {visible.map((status) => {
          const cards = columns[status];
          return (
            <section
              key={status}
              className="flex min-w-[15rem] shrink-0 flex-col gap-2 lg:min-w-0 lg:flex-1 lg:basis-0"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const raw = event.dataTransfer.getData(
                  "application/sanayidesk-card",
                );
                if (!raw) return;
                handleDrop(status, raw);
              }}
            >
              <div className="flex items-baseline justify-between px-0.5">
                <h2 className="text-sm font-medium text-neutral-500">
                  {STATUS_LABELS[status]}
                </h2>
                <span className="text-xs text-neutral-400">{cards.length}</span>
              </div>
              {cards.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-white px-3 py-6 text-center text-sm text-neutral-400">
                  Boş
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cards.map((card) => (
                    <li
                      key={card.id}
                      draggable={!pending}
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          "application/sanayidesk-card",
                          JSON.stringify({
                            id: card.id,
                            status: card.status,
                            remaining: card.remaining,
                          } satisfies DropPayload),
                        );
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      className="rounded-2xl border border-neutral-200 bg-white p-3 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/jobs/${card.id}`} className="min-w-0">
                          <p
                            className={
                              card.counterTitle
                                ? "text-lg font-medium tracking-normal"
                                : "font-mono text-lg tracking-wide"
                            }
                          >
                            {workOrderLabel(card)}
                          </p>
                          {card.displayNo ? (
                            <p className="font-mono text-xs text-neutral-500">
                              {card.displayNo}
                            </p>
                          ) : null}
                          {card.makeModel ? (
                            <p className="mt-1 truncate text-xs font-medium text-neutral-700">
                              {card.makeModel}
                            </p>
                          ) : null}
                          {truncateComplaint(card.complaint) ? (
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {truncateComplaint(card.complaint)}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-amber-800/90">
                            {card.waitText}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {card.assigneeName
                              ? `Usta: ${card.assigneeName}`
                              : "Usta atanmadı"}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            Toplam {formatMoney(card.due)} · Kalan{" "}
                            {formatMoney(card.remaining)}
                          </p>
                        </Link>
                      </div>
                      <div className="mt-2 border-t border-neutral-100 pt-2">
                        <AssignForm
                          workOrderId={card.id}
                          mechanics={mechanics}
                          currentMembershipId={card.assigneeMembershipId}
                          returnTo={returnTo}
                          compact
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
