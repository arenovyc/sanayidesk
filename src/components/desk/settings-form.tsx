"use client";

import { useActionState } from "react";
import { updateShopNameAction, type OpsActionState } from "@/app/(desk)/ops-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: OpsActionState = { error: null };

export function SettingsNameForm({
  defaultName,
  defaultPhone = "",
  defaultAddress = "",
}: {
  defaultName: string;
  defaultPhone?: string;
  defaultAddress?: string;
}) {
  const [state, action, pending] = useActionState(updateShopNameAction, initial);

  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Dükkan adı</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          placeholder="05xx…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Adres</Label>
        <Input
          id="address"
          name="address"
          defaultValue={defaultAddress}
          placeholder="Mahalle, sokak…"
        />
      </div>
      <Button type="submit" disabled={pending}>
        Kaydet
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
