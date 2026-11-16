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

export function JobItemsSection({
  workOrderId,
  items,
}: {
  workOrderId: string;
  items: WorkOrderItemRow[];
}) {
  const [itemState, itemAction, itemPending] = useActionState(
    addWorkOrderItemAction,
    initial,
  );

  return (
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
      <form
        action={itemAction}
        className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3"
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
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
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="description">Açıklama</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Tutar</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex items-end sm:col-span-2 sm:justify-end">
            <Button type="submit" size="sm" disabled={itemPending}>
              Kalem ekle
            </Button>
          </div>
        </div>
        {itemState.error ? (
          <p className="text-sm text-red-700">{itemState.error}</p>
        ) : null}
      </form>
    </section>
  );
}

export function JobPaymentSection({
  workOrderId,
  payments,
  due,
  paid,
  isOwner,
}: {
  workOrderId: string;
  payments: PaymentRow[];
  due: number;
  paid: number;
  isOwner: boolean;
}) {
  const [payState, payAction, payPending] = useActionState(addPaymentAction, initial);
  const [voidState, voidAction, voidPending] = useActionState(
    voidPaymentAction,
    initial,
  );
  const remaining = remainingDue(due, paid);

  return (
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
      <form
        action={payAction}
        className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3"
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-amount">Tutar</Label>
            <Input
              id="pay-amount"
              name="amount"
              inputMode="decimal"
              defaultValue={remaining > 0 ? String(remaining) : ""}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
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
          </div>
          <div className="flex flex-col gap-1.5">
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
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={payPending}>
              Tahsil et
            </Button>
          </div>
        </div>
        {payState.error ? (
          <p className="text-sm text-red-700">{payState.error}</p>
        ) : null}
      </form>
    </section>
  );
}

export function JobPartsSection({
  workOrderId,
  parts,
  plate,
  displayNo,
  shopName = "SanayiDesk",
  directory,
}: {
  workOrderId: string;
  parts: PartRequestRow[];
  plate: string;
  displayNo?: string | null;
  shopName?: string;
  directory?: DirectoryContact[];
}) {
  const [partState, partAction, partPending] = useActionState(
    addPartRequestAction,
    initial,
  );
  const contacts = directory ?? [];
  const [sharePhone, setSharePhone] = useState("");
  const sharePlain = waPartsVendorMessage({
    shopName,
    plate: displayNo ? `${displayNo} ${plate}` : plate,
    partsPlain: parts.map((p) => p.description).join(", ") || "—",
  });

  return (
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
      <form
        action={partAction}
        className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="part-description">Parça</Label>
          <Input id="part-description" name="description" required />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={partPending}>
          Parça ekle
        </Button>
        {partState.error ? (
          <p className="text-sm text-red-700 sm:basis-full">{partState.error}</p>
        ) : null}
      </form>
    </section>
  );
}

/** Full money stack — kept for any non-tab usages. */
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
  return (
    <div className="flex flex-col gap-6">
      <JobItemsSection workOrderId={workOrderId} items={items} />
      <JobPaymentSection
        workOrderId={workOrderId}
        payments={payments}
        due={due}
        paid={paid}
        isOwner={isOwner}
      />
      <JobPartsSection
        workOrderId={workOrderId}
        parts={parts}
        plate={plate}
        displayNo={displayNo}
        shopName={shopName}
        directory={directory}
      />
    </div>
  );
}
