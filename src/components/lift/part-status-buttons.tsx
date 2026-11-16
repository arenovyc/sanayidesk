"use client";

import { useActionState } from "react";
import {
  staffSetPartStatusAction,
  type StaffActionState,
} from "@/app/(lift)/actions";
import { Button } from "@/components/ui/button";

const initial: StaffActionState = { error: null };

export function PartStatusButtons({
  id,
  showOrdered = true,
}: {
  id: string;
  showOrdered?: boolean;
}) {
  const [state, action, pending] = useActionState(staffSetPartStatusAction, initial);

  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="id" value={id} />
      {showOrdered ? (
        <Button type="submit" name="status" value="ordered" size="sm" disabled={pending}>
          Sipariş
        </Button>
      ) : null}
      <Button type="submit" name="status" value="arrived" size="sm" disabled={pending}>
        Aldım
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
