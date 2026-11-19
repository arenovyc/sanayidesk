"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toastError } from "@/lib/ui/toast";
import {
  counterSaleAction,
  type CounterActionState,
} from "@/app/(desk)/counter-actions";
import { QuickPresets } from "@/components/desk/quick-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUICK_PRESETS, type TradeKind } from "@/lib/trade/kinds";

const initial: CounterActionState = { error: null };

export type SaleStockItem = {
  id: string;
  name: string;
  qty: number;
  unitCost: number;
};

export function CounterSaleForm({
  tradeKind,
  stockItems,
}: {
  tradeKind: TradeKind;
  stockItems: SaleStockItem[];
}) {
  const [state, action, pending] = useActionState(counterSaleAction, initial);

  useEffect(() => {
    if (state.error) toastError(state.error);
  }, [state]);
  const [title, setTitle] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [amount, setAmount] = useState("");
  const presets = QUICK_PRESETS[tradeKind];

  const selected = useMemo(
    () => stockItems.find((i) => i.id === itemId) ?? null,
    [itemId, stockItems],
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm"
    >
      <QuickPresets
        presets={presets}
        onPick={(text) => setTitle((prev) => (prev ? prev : text))}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Müşteri, komşu dükkan veya parça</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ahmet Oto — ön balata"
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

      {stockItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="itemId">Stoktan sat (opsiyonel)</Label>
            <select
              id="itemId"
              name="itemId"
              value={itemId}
              onChange={(e) => {
                const id = e.target.value;
                setItemId(id);
                const item = stockItems.find((i) => i.id === id);
                if (item && !amount) {
                  setAmount(String(item.unitCost));
                }
              }}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="">Elle tutar / stoksuz</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (stok {item.qty})
                </option>
              ))}
            </select>
          </div>
          {itemId ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qty">Adet</Label>
              <Input
                id="qty"
                name="qty"
                inputMode="decimal"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              {selected ? (
                <p className="text-xs text-neutral-500">
                  Birim ≈ {selected.unitCost.toLocaleString("tr-TR")} ₺
                </p>
              ) : null}
            </div>
          ) : (
            <input type="hidden" name="qty" value="1" />
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Tutar (₺)</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1400"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Tutar (₺, opsiyonel)</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1400"
          />
          <input type="hidden" name="itemId" value="" />
          <input type="hidden" name="qty" value="1" />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="payMethod">Ödeme</Label>
        <select
          id="payMethod"
          name="payMethod"
          className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
          defaultValue=""
        >
          <option value="">Şimdi ödeme yok</option>
          <option value="cash">Nakit</option>
          <option value="card">Kart</option>
          <option value="transfer">Havale</option>
          <option value="credit">Veresiye</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Not (opsiyonel)</Label>
        <Input id="note" name="note" />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="min-h-12 rounded-xl" disabled={pending}>
        {pending ? "…" : "Çıkış kaydet"}
      </Button>
    </form>
  );
}
