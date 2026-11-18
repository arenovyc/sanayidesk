"use client";

import { useActionState } from "react";
import {
  acceptWorkOrderAction,
  type JobActionState,
} from "@/app/(desk)/jobs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: JobActionState = { error: null };

export function AcceptForm({
  defaultPlate = "",
  defaultComplaint = "",
  extraFields = false,
}: {
  defaultPlate?: string;
  defaultComplaint?: string;
  extraFields?: boolean;
}) {
  const [state, action, pending] = useActionState(acceptWorkOrderAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className={extraFields ? "flex flex-col gap-1.5" : "flex gap-2"}>
        {extraFields ? <Label htmlFor="plate">Plaka</Label> : null}
        <Input
          id="plate"
          name="plate"
          defaultValue={defaultPlate}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="06ABC123"
          aria-label="Plaka"
          required
          className="font-mono text-lg tracking-wider uppercase"
        />
        {extraFields ? null : (
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "…" : "Kabul"}
          </Button>
        )}
      </div>
      {extraFields ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Müşteri adı (opsiyonel)</Label>
            <Input id="fullName" name="fullName" autoComplete="name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefon (opsiyonel)</Label>
            <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="complaint">Şikayet (opsiyonel)</Label>
            <textarea
              id="complaint"
              name="complaint"
              defaultValue={defaultComplaint}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Açılıyor…" : "İş emri aç"}
          </Button>
        </>
      ) : null}
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
