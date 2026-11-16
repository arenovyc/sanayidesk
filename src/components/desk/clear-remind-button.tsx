"use client";

import { useActionState } from "react";
import {
  clearWorkOrderRemindAction,
  type JobActionState,
} from "@/app/(desk)/jobs/actions";
import { Button } from "@/components/ui/button";

const initial: JobActionState = { error: null };

export function ClearRemindButton({
  workOrderId,
  returnTo = "/today",
}: {
  workOrderId: string;
  returnTo?: string;
}) {
  const [state, action, pending] = useActionState(
    clearWorkOrderRemindAction,
    initial,
  );

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={workOrderId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Kapat"}
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
