"use server";

import { revalidatePath } from "next/cache";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  firstInventoryZodError,
  quoteAmountSchema,
} from "@/lib/validations/inventory";

export type QuoteActionState = { error: string | null };

export async function setQuoteAmountAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  await requireDeskSession();
  const raw = String(formData.get("quoteAmount") ?? "").trim();
  const parsed = quoteAmountSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
    quoteAmount: raw === "" ? null : Number(raw),
  });
  if (!parsed.success) return { error: firstInventoryZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_set_quote_amount", {
    _work_order_id: parsed.data.workOrderId,
    _quote_amount: parsed.data.quoteAmount,
  });
  if (error) {
    return {
      error: error.message.toLowerCase().includes("quote_amount")
        ? "Teklif alanı yok. npm run db:push çalıştır."
        : error.message,
    };
  }
  revalidatePath(`/jobs/${parsed.data.workOrderId}`);
  return { error: null };
}
