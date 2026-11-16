"use client";

import { useActionState } from "react";
import {
  staffRequestPartsAction,
  type StaffActionState,
} from "@/app/(lift)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: StaffActionState = { error: null };

export function StaffPartsRequestForm({ workOrderId }: { workOrderId: string }) {
  const [state, action, pending] = useActionState(staffRequestPartsAction, initial);

  return (
    <form
      action={action}
      className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <input type="hidden" name="id" value={workOrderId} />
      <p className="text-sm font-medium">Parça iste</p>
      <Label htmlFor="lift-part-description">Açıklama</Label>
      <Input
        id="lift-part-description"
        name="description"
        placeholder="Örn. fren balatası"
        required
      />
      <Button type="submit" disabled={pending}>
        Parça isteği gönder
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
