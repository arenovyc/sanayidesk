"use client";

import { useActionState } from "react";
import {
  setCounterStatusAction,
  type CounterActionState,
} from "@/app/(desk)/counter-actions";
import { Button } from "@/components/ui/button";
import { TORNA_STATUS_LABELS } from "@/lib/trade/kinds";
import type { WorkOrderStatus } from "@/lib/work-orders/status";

const initial: CounterActionState = { error: null };

const STEPS = ["intake", "in_progress", "ready"] as const;

export function CounterStatusForm({
  workOrderId,
  status,
}: {
  workOrderId: string;
  status: WorkOrderStatus;
}) {
  const [state, action, pending] = useActionState(
    setCounterStatusAction,
    initial,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={workOrderId} />
      {STEPS.map((step) => {
        const active = status === step;
        return (
          <Button
            key={step}
            type="submit"
            name="status"
            value={step}
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={pending || active}
          >
            {TORNA_STATUS_LABELS[step]}
          </Button>
        );
      })}
      {state.error ? (
        <span className="text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}
