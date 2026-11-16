"use client";

import { useActionState } from "react";
import {
  staffUploadMediaAction,
  type StaffActionState,
} from "@/app/(lift)/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initial: StaffActionState = { error: null };

export function StaffMediaForm({ workOrderId }: { workOrderId: string }) {
  const [state, action, pending] = useActionState(staffUploadMediaAction, initial);

  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
      encType="multipart/form-data"
    >
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <p className="text-sm font-medium text-neutral-950">Foto çek / yükle</p>
      <Label htmlFor="lift-file">Görsel</Label>
      <input
        id="lift-file"
        name="file"
        type="file"
        accept="image/*"
        capture="environment"
        required
        className="text-sm"
      />
      <Button type="submit" size="lg" disabled={pending}>
        Yükle
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
