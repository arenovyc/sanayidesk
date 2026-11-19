"use client";

import { useActionState, useEffect, useState } from "react";
import {
  setWorkOrderStatusAction,
  type JobActionState,
} from "@/app/(desk)/jobs/actions";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format/money";
import { toastError } from "@/lib/ui/toast";
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
  returnToOnCancel = "/today",
}: {
  id: string;
  status: WorkOrderStatus;
  remaining?: number;
  /** İş iptal edilince yönlendirme (varsayılan Bugün). */
  returnToOnCancel?: string;
}) {
  const [state, action, pending] = useActionState(setWorkOrderStatusAction, initial);
  const next = allowedTransitions(status);
  const [pendingStatus, setPendingStatus] = useState<WorkOrderStatus | null>(
    null,
  );
  const [setRemind, setSetRemind] = useState(true);

  useEffect(() => {
    if (state.error) toastError(state.error);
  }, [state]);

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
              if (value === "cancelled" && returnToOnCancel) {
                fd.set("returnTo", returnToOnCancel);
              }
              if (value === "delivered" && setRemind) fd.set("setRemind", "1");
              action(fd);
            }}
          >
            {STATUS_LABELS[value]}
          </Button>
        ))}
      </div>

      <Sheet
        open={needsUnpaidConfirm && Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        title="Tahsilatsız teslim"
      >
        {pendingStatus ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-700">
              Bu işin {formatMoney(remaining)} kalan ödemesi var. Tahsilat
              almadan müşteri carisine (veresiye) borç yazarak devam etmek
              istiyor musun?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-12 flex-1 rounded-xl"
                disabled={pending}
                onClick={() => setPendingStatus(null)}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                className="min-h-12 flex-1 rounded-xl"
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
      </Sheet>

      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
