"use client";

import { useActionState } from "react";
import { setQuoteAmountAction, type QuoteActionState } from "@/app/(desk)/quote-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format/money";

const initial: QuoteActionState = { error: null };

export function JobQuoteForm({
  workOrderId,
  quoteAmount,
  compact = false,
}: {
  workOrderId: string;
  quoteAmount: number | null;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(setQuoteAmountAction, initial);

  if (compact) {
    return (
      <form
        action={action}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-neutral-200 bg-white px-3 py-2.5"
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <div className="min-w-[8rem] flex-1">
          <Label htmlFor="quoteAmount" className="text-xs text-neutral-500">
            Hızlı teklif (₺)
            {quoteAmount != null ? ` · kayıtlı ${formatMoney(quoteAmount)}` : ""}
          </Label>
          <Input
            id="quoteAmount"
            name="quoteAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={quoteAmount ?? ""}
            placeholder="0.00"
            className="mt-1 h-9"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Kaydet
        </Button>
        {state.error ? (
          <p className="basis-full text-sm text-red-700">{state.error}</p>
        ) : null}
      </form>
    );
  }

  return (
    <form
      action={action}
      className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <h2 className="text-sm font-medium text-neutral-500">Teklif</h2>
      {quoteAmount != null ? (
        <p className="text-sm text-neutral-600">
          Kayıtlı teklif:{" "}
          <span className="font-semibold">{formatMoney(quoteAmount)}</span>
        </p>
      ) : (
        <p className="text-sm text-neutral-400">Henüz teklif yok.</p>
      )}
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <Label htmlFor="quoteAmount">Tutar (₺)</Label>
      <Input
        id="quoteAmount"
        name="quoteAmount"
        type="number"
        step="0.01"
        min="0"
        defaultValue={quoteAmount ?? ""}
        placeholder="0.00"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-fit">
        Teklifi kaydet
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
