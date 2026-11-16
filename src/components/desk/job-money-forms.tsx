"use client";

import { useActionState, useState } from "react";
import {
  addPartRequestAction,
  addPaymentAction,
  addWorkOrderItemAction,
  voidPaymentAction,
  type MoneyActionState,
} from "@/app/(desk)/jobs/money-actions";
import { WhatsAppShareButton } from "@/components/desk/whatsapp-share-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DirectoryContact } from "@/lib/data/ops";
import { formatMoney } from "@/lib/format/money";
import { waPartsVendorMessage } from "@/lib/format/wa-templates";
import { remainingDue } from "@/lib/work-orders/money";
import type {
  PartRequestRow,
  PaymentRow,
  WorkOrderItemRow,
} from "@/lib/work-orders/types";

const initial: MoneyActionState = { error: null };

const METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale",
  credit: "Veresiye",
};

export function JobMoneyPanel({
  workOrderId,
  items,
  payments,
  parts,
  due,
  paid,
  plate,
  displayNo,
  shopName = "SanayiDesk",
  directory,
  isOwner,
}: {
  workOrderId: string;
  items: WorkOrderItemRow[];
  payments: PaymentRow[];
  parts: PartRequestRow[];
  due: number;
  paid: number;
  plate: string;
  displayNo?: string | null;
  shopName?: string;
  directory?: DirectoryContact[];
  isOwner: boolean;
}) {
  const [itemState, itemAction, itemPending] = useActionState(
    addWorkOrderItemAction,
    initial,
  );
  const [payState, payAction, payPending] = useActionState(addPaymentAction, initial);
  const [partState, partAction, partPending] = useActionState(
    addPartRequestAction,
    initial,
  );
  const [voidState, voidAction, voidPending] = useActionState(
    voidPaymentAction,
    initial,
  );
  const contacts = directory ?? [];
  const [sharePhone, setSharePhone] = useState("");

  const remaining = remainingDue(due, paid);
  const sharePlain = waPartsVendorMessage({
    shopName,
    plate: displayNo ? `${displayNo} ${plate}` : plate,
    partsPlain: parts.map((p) => p.description).join(", ") || "—",
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Kalemler</h2>
        {items.length === 0 ? (
          <p className="text-sm text-neutral-400">Henüz kalem yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  {item.description}
                  <span className="ml-2 text-neutral-400">{item.kind}</span>
                </span>
                <span>{formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <form action={itemAction} className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3">
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <Label htmlFor="kind">Tür</Label>
          <select
            id="kind"
            name="kind"
            defaultValue="labor"
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
          >
            <option value="labor">İşçilik</option>
            <option value="part">Parça</option>
            <option value="other">Diğer</option>
          </select>
          <Label htmlFor="description">Açıklama</Label>
          <Input id="description" name="description" required />
          <Label htmlFor="amount">Tutar</Label>
          <Input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required />
          <Button type="submit" disabled={itemPending}>
            Kalem ekle
          </Button>
          {itemState.error ? (
            <p className="text-sm text-red-700">{itemState.error}</p>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Tahsilat</h2>
          <p className="text-sm">
            Kalan <span className="font-semibold">{formatMoney(remaining)}</span>
          </p>
        </div>
        {payments.length > 0 ? (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-col gap-1 px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span>
                    {METHOD_LABELS[payment.method] ?? payment.method}
                    <span className="ml-2 text-neutral-400">{payment.invoiceMode}</span>
                    {payment.voidedAt ? (
                      <span className="ml-2 text-red-600">İptal</span>
                    ) : null}
                  </span>
                  <span className={payment.voidedAt ? "text-neutral-400 line-through" : ""}>
                    {formatMoney(payment.amount)}
                  </span>
                </div>
                {isOwner && !payment.voidedAt ? (
                  <form action={voidAction}>
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <input type="hidden" name="workOrderId" value={workOrderId} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={voidPending}
                      className="h-8"
                    >
                      İptal et
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {voidState.error ? (
          <p className="text-sm text-red-700">{voidState.error}</p>
        ) : null}
        <form action={payAction} className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3">
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <Label htmlFor="pay-amount">Tutar</Label>
          <Input
            id="pay-amount"
            name="amount"
            inputMode="decimal"
            defaultValue={remaining > 0 ? String(remaining) : ""}
            required
          />
          <Label htmlFor="method">Yöntem</Label>
          <select
            id="method"
            name="method"
            defaultValue="cash"
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
          >
            <option value="cash">Nakit</option>
            <option value="card">Kart</option>
            <option value="transfer">Havale</option>
            <option value="credit">Veresiye</option>
          </select>
          <Label htmlFor="invoiceMode">Fatura</Label>
          <select
            id="invoiceMode"
            name="invoiceMode"
            defaultValue="uninvoiced"
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
          >
            <option value="uninvoiced">Faturasız</option>
            <option value="invoiced">Faturalı</option>
          </select>
          <Button type="submit" disabled={payPending}>
            Tahsil et
          </Button>
          {payState.error ? (
            <p className="text-sm text-red-700">{payState.error}</p>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Parça istekleri</h2>
          {parts.length > 0 ? (
            <WhatsAppShareButton
              workOrderId={workOrderId}
              preview={sharePlain}
              phone={sharePhone || null}
              label="Parçacıya WhatsApp"
              emphasized
            />
          ) : null}
        </div>
        {parts.length > 0 && contacts.length > 0 ? (
          <div className="grid gap-1">
            <Label htmlFor="wa-directory">Parçacı (WhatsApp)</Label>
            <select
              id="wa-directory"
              className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
              value={sharePhone}
              onChange={(event) => setSharePhone(event.target.value)}
            >
              <option value="">Numarasız paylaş</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.phone}>
                  {contact.name}
                  {contact.phone ? ` · ${contact.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {parts.length === 0 ? (
          <p className="text-sm text-neutral-400">Parça isteği yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {parts.map((part) => (
              <li key={part.id} className="flex justify-between px-3 py-2 text-sm">
                <span>{part.description}</span>
                <span className="text-neutral-400">{part.status}</span>
              </li>
            ))}
          </ul>
        )}
        <form action={partAction} className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3">
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <Label htmlFor="part-description">Parça</Label>
          <Input id="part-description" name="description" required />
          <Button type="submit" disabled={partPending}>
            Parça ekle
          </Button>
          {partState.error ? (
            <p className="text-sm text-red-700">{partState.error}</p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
