"use client";

import { useActionState, useRef } from "react";
import {
  assignWorkOrderAction,
  type AssignActionState,
} from "@/app/(desk)/assign-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TeamMember } from "@/lib/data/ops";

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

  return (
    <form
      ref={formRef}
      action={action}
      className={compact ? "flex flex-col gap-1" : "grid gap-2"}
    >
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {!compact ? <Label htmlFor={`assignee-${workOrderId}`}>Usta</Label> : null}
      <div className={compact ? "flex gap-1" : "flex flex-col gap-2"}>
        <select
          id={`assignee-${workOrderId}`}
          name="membershipId"
          defaultValue={currentMembershipId ?? ""}
          disabled={pending || mechanics.length === 0}
          className={
            compact
              ? "h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-sm disabled:opacity-50"
              : "h-10 flex-1 rounded-lg border border-neutral-200 bg-white px-2 text-sm disabled:opacity-50"
          }
          onChange={() => {
            if (compact) formRef.current?.requestSubmit();
          }}
        >
          <option value="">Atanmamış</option>
          {mechanics.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName || "Usta"}
            </option>
          ))}
        </select>
        {!compact ? (
          <Button type="submit" size="sm" disabled={pending || mechanics.length === 0}>
            Kaydet
          </Button>
        ) : null}
      </div>
      {state.error ? <p className="text-xs text-red-700">{state.error}</p> : null}
    </form>
  );
}
