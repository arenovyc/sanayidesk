"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  addMechanicBonusSchema,
  firstOpsZodError,
} from "@/lib/validations/ops";

export type BonusActionState = {
  error: string | null;
};

function mapBonusError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("not_owner")) return "Yalnız patron prim ekleyebilir";
  if (text.includes("not_found")) return "İş emri bulunamadı";
  if (text.includes("invalid_mechanic")) return "Geçerli usta seç";
  if (text.includes("invalid_amount")) return "Tutar geçersiz";
  return message;
}

export async function addMechanicBonusAction(
  _prev: BonusActionState,
  formData: FormData,
): Promise<BonusActionState> {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") {
    return { error: "Yalnız patron prim ekleyebilir" };
  }

  const parsed = addMechanicBonusSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
    membershipId: String(formData.get("membershipId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_add_mechanic_bonus", {
    _work_order_id: parsed.data.workOrderId,
    _membership_id: parsed.data.membershipId,
    _amount: parsed.data.amount,
    _note: parsed.data.note,
  });
  if (error) return { error: mapBonusError(error.message) };
  redirect(`/jobs/${parsed.data.workOrderId}`);
}
