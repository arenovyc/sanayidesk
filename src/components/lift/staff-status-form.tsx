"use client";

import { useActionState } from "react";
import {
  staffRequestPartsAction,
  staffSetStatusAction,
  type StaffActionState,
} from "@/app/(lift)/actions";
import { Button } from "@/components/ui/button";
import {
  staffAllowedTransitions,
  STATUS_LABELS,
  type WorkOrderStatus,
} from "@/lib/work-orders/status";

const initial: StaffActionState = { error: null };

export function StaffStatusForm({
  id,
  status,
}: {
  id: string;
  status: WorkOrderStatus;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    staffSetStatusAction,
    initial,
  );
  const [partsState, partsAction, partsPending] = useActionState(
    staffRequestPartsAction,
    initial,
  );
  const next = staffAllowedTransitions(status).filter((value) => value !== "waiting_parts");

  return (
    <div className="flex flex-col gap-3">
      <form action={partsAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="description" value="Parça lazım" />
        <Button type="submit" size="xl" className="w-full" disabled={partsPending}>
          Parça lazım
        </Button>
      </form>
      <form action={statusAction} className="grid grid-cols-2 gap-2">
        <input type="hidden" name="id" value={id} />
        {next.map((value) => (
          <Button
            key={value}
            type="submit"
            name="status"
            value={value}
            size="xl"
            disabled={statusPending}
          >
            {STATUS_LABELS[value]}
          </Button>
        ))}
      </form>
      {(statusState.error || partsState.error) && (
        <p className="text-sm text-red-700" role="alert">
          {statusState.error || partsState.error}
        </p>
      )}
    </div>
  );
}
