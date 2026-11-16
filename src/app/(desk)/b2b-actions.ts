"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  b2bDecisionSchema,
  createB2bEntrySchema,
  externalPartySchema,
  firstOpsZodError,
} from "@/lib/validations/ops";

export type B2bActionState = {
  error: string | null;
};

function mapB2bError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("not_desk")) return "Bu işlem için yetkin yok";
  if (text.includes("not_found")) return "Kayıt bulunamadı";
  if (text.includes("invalid_amount")) return "Tutar geçersiz";
  if (text.includes("invalid_status")) return "Bu kayıt onaylanamaz";
  if (text.includes("not_owner")) return "Yalnız patron onaylayabilir";
  return message;
}

export async function addExternalPartyAction(
  _prev: B2bActionState,
  formData: FormData,
): Promise<B2bActionState> {
  const ctx = await requireDeskSession();
  const linked = String(formData.get("linkedDirectoryId") ?? "").trim();
  const linkedWs = String(formData.get("linkedWorkspaceId") ?? "").trim();
  const parsed = externalPartySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    note: String(formData.get("note") ?? ""),
    linkedDirectoryId: linked ? linked : null,
    linkedWorkspaceId: linkedWs ? linkedWs : null,
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const payload: Record<string, unknown> = {
    workspace_id: ctx.workspace.id,
    name: parsed.data.name,
    phone: parsed.data.phone,
    note: parsed.data.note,
    linked_directory_id: parsed.data.linkedDirectoryId,
  };
  if (parsed.data.linkedWorkspaceId) {
    payload.linked_workspace_id = parsed.data.linkedWorkspaceId;
  }

  const { error } = await supabase.from("external_parties").insert(payload);
  if (error) return { error: mapB2bError(error.message) };
  redirect(safeReturnTo(formData.get("returnTo"), "/b2b"));
}

function safeReturnTo(raw: FormDataEntryValue | null, fallback: string): string {
  const value = String(raw ?? "").trim();
  if (value.startsWith("/b2b") || value.startsWith("/jobs/")) return value;
  return fallback;
}

export async function createB2bEntryAction(
  _prev: B2bActionState,
  formData: FormData,
): Promise<B2bActionState> {
  await requireDeskSession();
  const workOrderRaw = String(formData.get("workOrderId") ?? "").trim();
  const parsed = createB2bEntrySchema.safeParse({
    externalPartyId: String(formData.get("externalPartyId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    direction: String(formData.get("direction") ?? "we_owe"),
    note: String(formData.get("note") ?? ""),
    workOrderId: workOrderRaw ? workOrderRaw : null,
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_create_b2b_entry", {
    _external_party_id: parsed.data.externalPartyId,
    _amount: parsed.data.amount,
    _direction: parsed.data.direction,
    _note: parsed.data.note,
    _work_order_id: parsed.data.workOrderId,
  });
  if (error) return { error: mapB2bError(error.message) };

  const fallback = parsed.data.workOrderId
    ? `/jobs/${parsed.data.workOrderId}`
    : "/b2b";
  redirect(safeReturnTo(formData.get("returnTo"), fallback));
}

export async function confirmB2bEntryAction(
  _prev: B2bActionState,
  formData: FormData,
): Promise<B2bActionState> {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") {
    return { error: "Yalnız patron onaylayabilir" };
  }
  const parsed = b2bDecisionSchema.safeParse({
    entryId: String(formData.get("entryId") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_confirm_b2b_entry", {
    _id: parsed.data.entryId,
  });
  if (error) return { error: mapB2bError(error.message) };
  redirect(safeReturnTo(formData.get("returnTo"), "/b2b"));
}

export async function rejectB2bEntryAction(
  _prev: B2bActionState,
  formData: FormData,
): Promise<B2bActionState> {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") {
    return { error: "Yalnız patron reddedebilir" };
  }
  const parsed = b2bDecisionSchema.safeParse({
    entryId: String(formData.get("entryId") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_reject_b2b_entry", {
    _id: parsed.data.entryId,
  });
  if (error) return { error: mapB2bError(error.message) };
  redirect(safeReturnTo(formData.get("returnTo"), "/b2b"));
}
