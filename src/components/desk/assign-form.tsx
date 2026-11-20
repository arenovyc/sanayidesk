"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  assignWorkOrderAction,
  type AssignActionState,
} from "@/app/(desk)/assign-actions";
import { Label } from "@/components/ui/label";
import type { TeamMember } from "@/lib/data/ops";
import { toastError, toastSuccess } from "@/lib/ui/toast";

const initial: AssignActionState = { error: null };

export function AssignForm({
  workOrderId,
  mechanics,
  currentMembershipId,
  returnTo,
  compact,
}: {
  workOrderId: string;
  mechanics: TeamMember[];
  currentMembershipId: string | null;
  returnTo: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(assignWorkOrderAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const lastToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.error) {
      toastError(state.error);
      return;
    }
    // Success after submit: action returns { error: null } — toast once per pending cycle
    if (!pending && state.error === null && lastToastRef.current === "pending") {
      toastSuccess("Usta kaydedildi");
      lastToastRef.current = "done";
    }
  }, [state, pending]);

  useEffect(() => {
    if (pending) lastToastRef.current = "pending";
  }, [pending]);

  return (
    <form
      ref={formRef}
      action={action}
      className={compact ? "flex flex-col gap-1" : "grid gap-2"}
    >
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {!compact ? <Label htmlFor={`assignee-${workOrderId}`}>Usta</Label> : null}
      <select
        id={`assignee-${workOrderId}`}
        name="membershipId"
        defaultValue={currentMembershipId ?? ""}
        disabled={pending || mechanics.length === 0}
        className={
          compact
            ? "h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-sm disabled:opacity-50"
            : "h-10 w-full rounded-lg border border-neutral-200 bg-white px-2 text-sm disabled:opacity-50"
        }
        onChange={() => {
          formRef.current?.requestSubmit();
        }}
      >
        <option value="">Atanmamış</option>
        {mechanics.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName || "Usta"}
          </option>
        ))}
      </select>
      {state.error ? <p className="text-xs text-red-700">{state.error}</p> : null}
    </form>
  );
}
