"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setWorkOrderStatusAction } from "@/app/(desk)/jobs/actions";
import { Button } from "@/components/ui/button";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { Money } from "@/components/ui/money";
import { Sheet } from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format/money";
import {
  shortDisplayNo,
  truncateComplaint,
} from "@/lib/format/wait-label";
import type { TeamMember } from "@/lib/data/ops";
import { statusLabelFor } from "@/lib/trade/profile";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { statusForBoardDrop } from "@/lib/work-orders/board-drop";
import { workOrderLabel } from "@/lib/work-orders/display";
import type { BoardCard } from "@/lib/work-orders/types";
import {
  OPEN_STATUSES,
  type OpenWorkOrderStatus,
  type WorkOrderStatus,
} from "@/lib/work-orders/status";
import { statusTone } from "@/lib/work-orders/status-tone";

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

function BoardCardBody({
  card,
  returnTo,
  columnStatus,
}: {
  card: BoardCard;
  returnTo: string;
  columnStatus: OpenWorkOrderStatus;
}) {
  const title = shortDisplayNo(card.displayNo);
  const complaint = truncateComplaint(card.complaint, 80);
  const hasMoney = card.due > 0 || card.remaining > 0;
  const waitNeutral = columnStatus === "ready";

  return (
    <Link
      href={`/jobs/${card.id}?from=${encodeURIComponent(returnTo)}`}
      prefetch
      className="flex min-w-0 flex-col gap-1.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {card.counterTitle || !card.plate ? (
            <p className="truncate text-sm font-semibold tracking-tight text-neutral-950">
              {workOrderLabel(card)}
            </p>
          ) : (
            <LicensePlateBadge plate={card.plate} size="sm" />
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {title ? (
            <span className="font-mono text-[11px] tabular-nums text-neutral-400">
              {title}
            </span>
          ) : null}
          {card.waitBadge ? (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                waitNeutral
                  ? "bg-neutral-100 text-neutral-500"
                  : "bg-amber-50 text-amber-800",
              )}
              title={card.waitText}
            >
              {card.waitBadge}
            </span>
          ) : null}
        </div>
      </div>

      {card.makeModel ? (
        <p className="truncate text-sm font-semibold text-neutral-950">
          {card.makeModel}
        </p>
      ) : null}
      {complaint ? (
        <p className="line-clamp-2 text-xs text-neutral-600">{complaint}</p>
      ) : null}

      {hasMoney ? (
        <div className="mt-0.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {card.assigneeName ? (
              <p className="truncate text-xs text-neutral-500">
                {card.assigneeName}
              </p>
            ) : (
              <span className="inline-flex rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                Usta atanmadı
              </span>
            )}
          </div>
          <p className="shrink-0 text-right text-xs text-neutral-600">
            <Money amount={card.due} tone="muted" />
            {card.remaining > 0 ? (
              <>
                {" · "}
                <Money amount={card.remaining} tone="debt" />
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <div className="mt-0.5 flex items-center justify-between gap-2">
          {card.assigneeName ? (
            <p className="truncate text-xs text-neutral-500">
              {card.assigneeName}
            </p>
          ) : (
            <span className="inline-flex rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              Usta atanmadı
            </span>
          )}
          <p className="shrink-0 text-[11px] text-neutral-400">Fiyat girilmedi</p>
        </div>
      )}
    </Link>
  );
}

function ColumnHeader({
  status,
  count,
  tradeKind,
}: {
  status: OpenWorkOrderStatus;
  count: number;
  tradeKind?: string | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-0.5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <span
          className={cn("h-1.5 w-6 rounded-full", statusTone(status).bar)}
          aria-hidden
        />
        {statusLabelFor(tradeKind, status)}
      </h2>
      <span className="text-xs tabular-nums text-neutral-400">{count}</span>
    </div>
  );
}

export function BoardColumns({
  columns,
  mechanics: _mechanics,
  returnTo,
  highlightStatus,
  tradeKind,
}: {
  columns: Record<OpenWorkOrderStatus, BoardCard[]>;
  mechanics: TeamMember[];
  returnTo: string;
  highlightStatus?: OpenWorkOrderStatus | null;
  tradeKind?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDrop, setConfirmDrop] = useState<PendingDrop | null>(null);

  const defaultMobile = useMemo(() => {
    if (highlightStatus) return highlightStatus;
    const firstFilled = OPEN_STATUSES.find(
      (status) => columns[status].length > 0,
    );
    return firstFilled ?? "intake";
  }, [columns, highlightStatus]);

  const [mobileStatus, setMobileStatus] =
    useState<OpenWorkOrderStatus>(defaultMobile);

  const activeMobile = highlightStatus ?? mobileStatus;

  const desktopStatuses = highlightStatus
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

  function renderCardList(status: OpenWorkOrderStatus, cards: BoardCard[]) {
    if (cards.length === 0) {
      return (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-white px-3 py-6 text-center text-sm text-neutral-400">
          Boş
        </p>
      );
    }
    return (
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
            className={cn(surfaceCard, "p-3 active:cursor-grabbing")}
          >
            <BoardCardBody
              card={card}
              returnTo={returnTo}
              columnStatus={status}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Sheet
        open={Boolean(confirmDrop)}
        onClose={() => setConfirmDrop(null)}
        title="Tahsilatsız teslim"
      >
        {confirmDrop ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-700">
              Bu işin {formatMoney(confirmDrop.remaining)} kalan ödemesi var.
              Tahsilat almadan müşteri carisine (veresiye) borç yazarak devam
              etmek istiyor musun?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-12 flex-1 rounded-xl"
                disabled={pending}
                onClick={() => setConfirmDrop(null)}
              >
                İptal
              </Button>
              <Button
                type="button"
                className="min-h-12 flex-1 rounded-xl"
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
      </Sheet>

      {/* Mobile: status chips + single column */}
      <div className="flex flex-col gap-3 md:hidden">
        {!highlightStatus ? (
          <div
            role="tablist"
            aria-label="Durum filtresi"
            className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1"
          >
            {OPEN_STATUSES.map((status) => {
              const active = activeMobile === status;
              const count = columns[status].length;
              return (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMobileStatus(status)}
                  className={cn(
                    "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
                    active
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-700",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      active ? "bg-white/80" : statusTone(status).bar,
                    )}
                    aria-hidden
                  />
                  {statusLabelFor(tradeKind, status)}
                  <span
                    className={cn(
                      "tabular-nums",
                      active ? "text-white/70" : "text-neutral-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        <ColumnHeader
          status={activeMobile}
          count={columns[activeMobile].length}
          tradeKind={tradeKind}
        />
        {renderCardList(activeMobile, columns[activeMobile])}
      </div>

      {/* Desktop / tablet: kanban columns */}
      <div className="-mx-4 hidden gap-3 overflow-x-auto px-4 pb-2 md:flex lg:mx-0 lg:gap-2.5 lg:overflow-x-visible lg:px-0 xl:gap-3">
        {desktopStatuses.map((status) => {
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
              <ColumnHeader
                status={status}
                count={cards.length}
                tradeKind={tradeKind}
              />
              {renderCardList(status, cards)}
            </section>
          );
        })}
      </div>
    </div>
  );
}
