"use client";

import { useActionState } from "react";
import {
  setTradeKindAction,
  type CounterActionState,
} from "@/app/(desk)/counter-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  TRADE_KINDS,
  TRADE_KIND_LABELS,
  type TradeKind,
} from "@/lib/trade/kinds";

const initial: CounterActionState = { error: null };

export function TradeKindForm({ current }: { current: TradeKind }) {
  const [state, action, pending] = useActionState(setTradeKindAction, initial);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <div>
        <Label htmlFor="tradeKind">Dükkan türü</Label>
        <p className="mt-0.5 text-xs text-neutral-500">
          Yanlış seçtiysen değiştir — menü ve Bugün ekranı buna göre değişir.
        </p>
      </div>
      <select
        id="tradeKind"
        name="tradeKind"
        defaultValue={current}
        className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
      >
        {TRADE_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {TRADE_KIND_LABELS[kind]}
          </option>
        ))}
      </select>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Kaydediliyor…" : "Türü kaydet"}
      </Button>
    </form>
  );
}
