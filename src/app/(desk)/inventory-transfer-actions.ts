"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  cancelTransferSchema,
  firstTransferZodError,
  requestTransferSchema,
  respondTransferSchema,
} from "@/lib/validations/inventory-transfer";

export type TransferActionState = { error: string | null };

function mapError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("insufficient_stock")) return "Stok yetersiz";
  if (text.includes("invalid_amount")) return "Miktar geçersiz";
  if (text.includes("invalid_target")) return "Hedef dükkan geçersiz";
  if (text.includes("invalid_status")) return "İstek güncellenemez";
  if (text.includes("forbidden")) return "Yetkin yok";
  if (text.includes("not_found")) return "Kayıt bulunamadı";
  return message;
}

export async function requestInventoryTransferAction(
  _prev: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  await requireDeskSession();
  const parsed = requestTransferSchema.safeParse({
    fromItemId: String(formData.get("fromItemId") ?? ""),
    toWorkspaceId: String(formData.get("toWorkspaceId") ?? ""),
    qty: formData.get("qty"),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: firstTransferZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_request_inventory_transfer", {
    _from_item_id: parsed.data.fromItemId,
    _to_workspace_id: parsed.data.toWorkspaceId,
    _qty: parsed.data.qty,
    _note: parsed.data.note,
  });
  if (error) return { error: mapError(error.message) };
  redirect("/inventory");
}

export async function respondInventoryTransferAction(
  _prev: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  await requireDeskSession();
  const parsed = respondTransferSchema.safeParse({
    requestId: String(formData.get("requestId") ?? ""),
    approve: String(formData.get("approve") ?? "false"),
  });
  if (!parsed.success) return { error: firstTransferZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_respond_inventory_transfer", {
    _request_id: parsed.data.requestId,
    _approve: parsed.data.approve === "true",
  });
  if (error) return { error: mapError(error.message) };
  redirect("/inventory");
}

export async function cancelInventoryTransferAction(
  _prev: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  await requireDeskSession();
  const parsed = cancelTransferSchema.safeParse({
    requestId: String(formData.get("requestId") ?? ""),
  });
  if (!parsed.success) return { error: firstTransferZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_cancel_inventory_transfer", {
    _request_id: parsed.data.requestId,
  });
  if (error) return { error: mapError(error.message) };
  redirect("/inventory");
}
