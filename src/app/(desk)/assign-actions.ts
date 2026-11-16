"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  assignWorkOrderSchema,
  firstOpsZodError,
} from "@/lib/validations/ops";

export type AssignActionState = {
  error: string | null;
};

function mapAssignError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("not_desk")) return "Bu işlem için yetkin yok";
  if (text.includes("not_found")) return "İş emri bulunamadı";
  if (text.includes("invalid_mechanic")) return "Geçerli usta seç";
  return message;
}

function safeReturnTo(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (value.startsWith("/board") || value.startsWith("/jobs/") || value === "/load") {
    return value;
  }
  return "/board";
}

export async function assignWorkOrderAction(
  _prev: AssignActionState,
  formData: FormData,
): Promise<AssignActionState> {
  await requireDeskSession();
  const parsed = assignWorkOrderSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
    membershipId: String(formData.get("membershipId") ?? ""),
    returnTo: String(formData.get("returnTo") ?? "/board"),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_assign_work_order", {
    _work_order_id: parsed.data.workOrderId,
    _membership_id: parsed.data.membershipId,
  });
  if (error) return { error: mapAssignError(error.message) };
  redirect(safeReturnTo(parsed.data.returnTo));
}
