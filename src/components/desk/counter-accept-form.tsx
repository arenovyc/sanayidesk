"use client";

import { useActionState, useState } from "react";
import {
  acceptCounterOrderAction,
  type CounterActionState,
} from "@/app/(desk)/counter-actions";
import { QuickPresets } from "@/components/desk/quick-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUICK_PRESETS, type TradeKind } from "@/lib/trade/kinds";

const initial: CounterActionState = { error: null };

export function CounterAcceptForm({
  tradeKind,
  showCredit = false,
}: {
  tradeKind: TradeKind;
  showCredit?: boolean;
}) {
  const [state, action, pending] = useActionState(
    acceptCounterOrderAction,
    initial,
  );
  const [title, setTitle] = useState("");
  const presets = QUICK_PRESETS[tradeKind];

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <QuickPresets
        presets={presets}
        onPick={(text) => setTitle((prev) => (prev ? prev : text))}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">
          {tradeKind === "torna"
            ? "Gönderen dükkan / müşteri / iş"
            : "Müşteri, komşu dükkan veya parça"}
        </Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            tradeKind === "torna"
              ? "Mehmet Usta — silindir kapak"
              : "Ahmet Oto — ön balata"
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">İsim (opsiyonel)</Label>
          <Input id="fullName" name="fullName" autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefon (opsiyonel)</Label>
          <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" />
        </div>
      </div>
      {showCredit ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Tutar (₺, opsiyonel)</Label>
            <Input id="amount" name="amount" inputMode="decimal" placeholder="1400" />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700">
            <input type="checkbox" name="asCredit" value="1" className="size-4" />
            Veresiye olarak kaydet
          </label>
        </div>
      ) : (
        <input type="hidden" name="amount" value="" />
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Not (opsiyonel)</Label>
        <Input id="note" name="note" />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : tradeKind === "torna" ? "İş aç" : "Çıkış kaydet"}
      </Button>
    </form>
  );
}
