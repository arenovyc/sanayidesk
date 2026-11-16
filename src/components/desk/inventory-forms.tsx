"use client";

import { useActionState } from "react";
import {
  moveInventoryAction,
  upsertInventoryItemAction,
  type InventoryActionState,
} from "@/app/(desk)/inventory-actions";
import {
  cancelInventoryTransferAction,
  requestInventoryTransferAction,
  respondInventoryTransferAction,
  type TransferActionState,
} from "@/app/(desk)/inventory-transfer-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format/money";
import type { InventoryItem, InventoryMovement } from "@/lib/data/inventory";
import type { InventoryTransferRow } from "@/lib/data/inventory-transfers";
import { isLowStock } from "@/lib/inventory/rules";
import { transferStatusLabel } from "@/lib/inventory/transfer-rules";

const initial: InventoryActionState = { error: null };
const transferInitial: TransferActionState = { error: null };

const KIND_LABEL: Record<string, string> = {
  in: "Giriş",
  out: "Çıkış",
  adjust: "Düzeltme",
};

export function InventoryPanel({
  items,
  movements,
  transfers = [],
  networkShops = [],
  workspaceId,
}: {
  items: InventoryItem[];
  movements: InventoryMovement[];
  transfers?: InventoryTransferRow[];
  networkShops?: { id: string; name: string; isMine?: boolean }[];
  workspaceId: string;
}) {
  const [addState, addAction, addPending] = useActionState(
    upsertInventoryItemAction,
    initial,
  );
  const [moveState, moveAction, movePending] = useActionState(
    moveInventoryAction,
    initial,
  );
  const [transferState, transferAction, transferPending] = useActionState(
    requestInventoryTransferAction,
    transferInitial,
  );
  const targets = networkShops.filter((shop) => !shop.isMine && shop.id !== workspaceId);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Stok listesi</h2>
        {items.length === 0 ? (
          <p className="text-sm text-neutral-400">Henüz stok kartı yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span>
                    <span className="font-medium">{item.name}</span>
                    {item.sku ? (
                      <span className="ml-2 font-mono text-xs text-neutral-400">
                        {item.sku}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={
                      isLowStock(item.availableQty, item.minQty)
                        ? "font-semibold text-amber-800"
                        : "tabular-nums"
                    }
                  >
                    {item.availableQty}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Rafta: {item.qty} · Ayrılan: {item.reservedQty} ·
                  Kullanılabilir: {item.availableQty} · Min {item.minQty} ·{" "}
                  {formatMoney(item.unitCost)}
                  {isLowStock(item.availableQty, item.minQty)
                    ? " · düşük stok"
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        action={addAction}
        className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <h2 className="font-medium">Yeni stok kartı</h2>
        <Label htmlFor="name">Ad</Label>
        <Input id="name" name="name" required />
        <Label htmlFor="sku">SKU (opsiyonel)</Label>
        <Input id="sku" name="sku" />
        <Label htmlFor="initialQty">Açılış miktarı</Label>
        <Input
          id="initialQty"
          name="initialQty"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
        />
        <Label htmlFor="unitCost">Birim maliyet</Label>
        <Input
          id="unitCost"
          name="unitCost"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
        />
        <Label htmlFor="minQty">Min stok</Label>
        <Input
          id="minQty"
          name="minQty"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
        />
        <Button type="submit" disabled={addPending}>
          Ekle
        </Button>
        {addState.error ? (
          <p className="text-sm text-red-700">{addState.error}</p>
        ) : null}
      </form>

      <form
        action={moveAction}
        className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <h2 className="font-medium">Stok hareketi</h2>
        <input type="hidden" name="returnTo" value="/inventory" />
        <Label htmlFor="itemId">Kalem</Label>
        <select
          id="itemId"
          name="itemId"
          required
          className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
          disabled={items.length === 0}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — Rafta: {item.qty} · Ayrılan: {item.reservedQty} ·
              Kullanılabilir: {item.availableQty}
            </option>
          ))}
        </select>
        <Label htmlFor="kind">Tür</Label>
        <select
          id="kind"
          name="kind"
          defaultValue="in"
          className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
        >
          <option value="in">Giriş</option>
          <option value="out">Çıkış</option>
          <option value="adjust">Düzelt (mutlak miktar)</option>
        </select>
        <Label htmlFor="qty">Miktar</Label>
        <Input id="qty" name="qty" type="number" step="0.01" min="0.01" required />
        <Label htmlFor="note">Not</Label>
        <Input id="note" name="note" />
        <Button type="submit" disabled={movePending || items.length === 0}>
          Kaydet
        </Button>
        {moveState.error ? (
          <p className="text-sm text-red-700">{moveState.error}</p>
        ) : null}
      </form>

      <form
        action={transferAction}
        className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <h2 className="font-medium">Dükkanlar arası transfer</h2>
        <p className="text-xs text-neutral-500">
          Hedef dükkan onaylayınca stok iki tarafta güncellenir. Ağda görünür
          dükkanlar listelenir.
        </p>
        <Label htmlFor="fromItemId">Kalem</Label>
        <select
          id="fromItemId"
          name="fromItemId"
          required
          className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
          disabled={items.length === 0 || targets.length === 0}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — Rafta: {item.qty} · Ayrılan: {item.reservedQty} ·
              Kullanılabilir: {item.availableQty}
            </option>
          ))}
        </select>
        <Label htmlFor="toWorkspaceId">Hedef dükkan</Label>
        <select
          id="toWorkspaceId"
          name="toWorkspaceId"
          required
          className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
          disabled={targets.length === 0}
        >
          {targets.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
        <Label htmlFor="transferQty">Miktar</Label>
        <Input
          id="transferQty"
          name="qty"
          type="number"
          step="0.01"
          min="0.01"
          required
        />
        <Label htmlFor="transferNote">Not</Label>
        <Input id="transferNote" name="note" />
        <Button
          type="submit"
          disabled={
            transferPending || items.length === 0 || targets.length === 0
          }
        >
          Transfer iste
        </Button>
        {targets.length === 0 ? (
          <p className="text-xs text-neutral-400">
            Hedef yok — diğer dükkanların “Ağda görün” açık olmalı.
          </p>
        ) : null}
        {transferState.error ? (
          <p className="text-sm text-red-700">{transferState.error}</p>
        ) : null}
      </form>

      <TransferList transfers={transfers} workspaceId={workspaceId} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Son hareketler</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-neutral-400">Hareket yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {movements.map((row) => {
              const item = items.find((i) => i.id === row.itemId);
              return (
                <li key={row.id} className="flex justify-between px-4 py-2.5 text-sm">
                  <span>
                    {KIND_LABEL[row.kind] ?? row.kind} · {item?.name ?? "—"}
                    {row.note ? (
                      <span className="block text-xs text-neutral-400">{row.note}</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums">{row.qty}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function TransferList({
  transfers,
  workspaceId,
}: {
  transfers: InventoryTransferRow[];
  workspaceId: string;
}) {
  if (transfers.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Transfer istekleri</h2>
        <p className="text-sm text-neutral-400">İstek yok.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-neutral-500">Transfer istekleri</h2>
      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {transfers.map((row) => (
          <TransferRowActions
            key={row.id}
            row={row}
            workspaceId={workspaceId}
          />
        ))}
      </ul>
    </section>
  );
}

function TransferRowActions({
  row,
  workspaceId,
}: {
  row: InventoryTransferRow;
  workspaceId: string;
}) {
  const [respondState, respondAction, respondPending] = useActionState(
    respondInventoryTransferAction,
    transferInitial,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelInventoryTransferAction,
    transferInitial,
  );

  const incoming = row.toWorkspaceId === workspaceId;
  const outgoing = row.fromWorkspaceId === workspaceId;

  return (
    <li className="flex flex-col gap-2 px-4 py-3 text-sm">
      <div className="flex justify-between gap-2">
        <span>
          <span className="font-medium">{row.itemName ?? "Kalem"}</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            {incoming ? "Gelen" : "Giden"} · {transferStatusLabel(row.status)} ·{" "}
            {row.qty}
          </span>
        </span>
      </div>
      {row.status === "pending" && incoming ? (
        <div className="flex gap-2">
          <form action={respondAction}>
            <input type="hidden" name="requestId" value={row.id} />
            <input type="hidden" name="approve" value="true" />
            <Button type="submit" size="sm" disabled={respondPending}>
              Onayla
            </Button>
          </form>
          <form action={respondAction}>
            <input type="hidden" name="requestId" value={row.id} />
            <input type="hidden" name="approve" value="false" />
            <Button type="submit" size="sm" variant="outline" disabled={respondPending}>
              Reddet
            </Button>
          </form>
        </div>
      ) : null}
      {row.status === "pending" && outgoing ? (
        <form action={cancelAction}>
          <input type="hidden" name="requestId" value={row.id} />
          <Button type="submit" size="sm" variant="outline" disabled={cancelPending}>
            İptal
          </Button>
        </form>
      ) : null}
      {respondState.error || cancelState.error ? (
        <p className="text-sm text-red-700">
          {respondState.error ?? cancelState.error}
        </p>
      ) : null}
    </li>
  );
}

export function JobInventoryIssueForm({
  workOrderId,
  items,
}: {
  workOrderId: string;
  items: InventoryItem[];
}) {
  const [state, action, pending] = useActionState(moveInventoryAction, initial);
  if (items.length === 0) return null;

  return (
    <form
      action={action}
      className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <h2 className="text-sm font-medium text-neutral-500">Stoktan düş</h2>
      <input type="hidden" name="kind" value="out" />
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <input type="hidden" name="returnTo" value={`/jobs/${workOrderId}`} />
      <Label htmlFor="jobItemId">Kalem</Label>
      <select
        id="jobItemId"
        name="itemId"
        required
        className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} — Rafta: {item.qty} · Ayrılan: {item.reservedQty} ·
            Kullanılabilir: {item.availableQty}
          </option>
        ))}
      </select>
      <Label htmlFor="jobQty">Miktar</Label>
      <Input id="jobQty" name="qty" type="number" step="0.01" min="0.01" required />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-fit">
        Stok düş
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
