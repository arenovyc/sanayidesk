"use client";

import { useActionState, useState } from "react";
import {
  setWorkOrderStatusAction,
  type JobActionState,
} from "@/app/(desk)/jobs/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format/money";
import {
  allowedTransitions,
  STATUS_LABELS,
  type WorkOrderStatus,
} from "@/lib/work-orders/status";

const initial: JobActionState = { error: null };

export function JobStatusForm({
  id,
  status,
  remaining = 0,
}: {
  id: string;
  status: WorkOrderStatus;
  remaining?: number;
}) {
  const [state, action, pending] = useActionState(setWorkOrderStatusAction, initial);
  const next = allowedTransitions(status);
  const [pendingStatus, setPendingStatus] = useState<WorkOrderStatus | null>(
    null,
  );
  const [setRemind, setSetRemind] = useState(true);

  if (next.length === 0) {
    return (
      <p className="text-sm text-neutral-500">Bu iş kapandı; durum değiştirilemez.</p>
    );
  }

  const needsUnpaidConfirm =
    pendingStatus === "ready" || pendingStatus === "delivered"
      ? remaining > 0
      : false;

  return (
    <div className="flex flex-col gap-3">
      {next.includes("delivered") ? (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={setRemind}
            onChange={(event) => setSetRemind(event.target.checked)}
            className="size-4 rounded border-neutral-300"
          />
          10 ay sonra bakım hatırlat
        </label>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {next.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={value === "cancelled" ? "outline" : "default"}
            disabled={pending}
            className="rounded-full px-3.5"
            onClick={() => {
              if (
                (value === "ready" || value === "delivered") &&
                remaining > 0
              ) {
                setPendingStatus(value);
                return;
              }
              const fd = new FormData();
              fd.set("id", id);
              fd.set("status", value);
              if (value === "delivered" && setRemind) fd.set("setRemind", "1");
              action(fd);
            }}
          >
            {STATUS_LABELS[value]}
          </Button>
        ))}
      </div>

      {needsUnpaidConfirm && pendingStatus ? (
        <div
          role="dialog"
          aria-modal="true"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm text-amber-950">
            Bu işin {formatMoney(remaining)} kalan ödemesi var. Tahsilat
            almadan müşteri carisine (veresiye) borç yazarak devam etmek
            istiyor musun?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setPendingStatus(null)}
            >
              İptal
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", id);
                fd.set("status", pendingStatus);
                fd.set("allowUnpaid", "1");
                if (pendingStatus === "delivered" && setRemind) {
                  fd.set("setRemind", "1");
                }
                setPendingStatus(null);
                action(fd);
              }}
            >
              Veresiye devam
            </Button>
          </div>
        </div>
      ) : null}

      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
