"use client";

import { useActionState } from "react";
import {
  updateJobIntakeAction,
  type JobActionState,
} from "@/app/(desk)/jobs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: JobActionState = { error: null };

export function JobIntakeCompleteForm({
  workOrderId,
  fullName,
  phone,
  complaint,
  makeModel,
}: {
  workOrderId: string;
  fullName: string;
  phone: string;
  complaint: string;
  makeModel: string;
}) {
  const [state, action, pending] = useActionState(updateJobIntakeAction, initial);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4"
    >
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <div>
        <p className="text-sm font-medium text-amber-950">Hızlı tamamla</p>
        <p className="mt-0.5 text-xs text-amber-900/80">
          Müşteri, telefon, araç ve şikayet — kabul sonrası doldur.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Müşteri adı</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={fullName}
            autoComplete="name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={phone}
            autoComplete="tel"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="makeModel">Marka / model</Label>
          <Input
            id="makeModel"
            name="makeModel"
            placeholder="Örn. Fiat Fiorino"
            defaultValue={makeModel}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="complaint">Şikayet / iş özeti</Label>
          <textarea
            id="complaint"
            name="complaint"
            rows={2}
            defaultValue={complaint}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
          />
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}
