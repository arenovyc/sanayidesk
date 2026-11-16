"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  firstInventoryZodError,
  inventoryMoveSchema,
  inventoryUpsertSchema,
} from "@/lib/validations/inventory";

export type InventoryActionState = { error: string | null };

function mapInventoryError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("insufficient_stock")) return "Stok yetersiz";
  if (text.includes("invalid_amount")) return "Miktar geçersiz";
  if (text.includes("invalid_name")) return "Ad gerekli";
  if (text.includes("forbidden")) return "Yetkin yok";
  if (text.includes("not_found")) return "Kayıt bulunamadı";
  return message;
}

export async function upsertInventoryItemAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  await requireDeskSession();
  const idRaw = String(formData.get("id") ?? "").trim();
  const parsed = inventoryUpsertSchema.safeParse({
    id: idRaw || undefined,
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    unitCost: formData.get("unitCost"),
    minQty: formData.get("minQty"),
    initialQty: formData.get("initialQty") || 0,
  });
  if (!parsed.success) return { error: firstInventoryZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_inventory_upsert_item", {
    _id: parsed.data.id || null,
    _name: parsed.data.name,
    _sku: parsed.data.sku || null,
    _unit_cost: parsed.data.unitCost,
    _min_qty: parsed.data.minQty,
    _initial_qty: parsed.data.id ? 0 : (parsed.data.initialQty ?? 0),
  });
  if (error) return { error: mapInventoryError(error.message) };
  redirect("/inventory");
}

export async function moveInventoryAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  await requireDeskSession();
  const wo = String(formData.get("workOrderId") ?? "").trim();
  const parsed = inventoryMoveSchema.safeParse({
    itemId: String(formData.get("itemId") ?? ""),
    kind: String(formData.get("kind") ?? ""),
    qty: formData.get("qty"),
    workOrderId: wo || undefined,
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: firstInventoryZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_inventory_move", {
    _item_id: parsed.data.itemId,
    _kind: parsed.data.kind,
    _qty: parsed.data.qty,
    _work_order_id: parsed.data.workOrderId || null,
    _note: parsed.data.note,
  });
  if (error) return { error: mapInventoryError(error.message) };

  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (returnTo.startsWith("/jobs/") || returnTo === "/inventory") {
    redirect(returnTo);
  }
  redirect("/inventory");
}
