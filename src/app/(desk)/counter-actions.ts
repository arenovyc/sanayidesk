"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { firstZodError } from "@/lib/validations/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";

export type CounterActionState = { error: string | null };

const acceptSchema = z.object({
  title: z.string().trim().min(2, "Başlık en az 2 karakter").max(120),
  fullName: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().max(20).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
  amount: z
    .string()
    .optional()
    .default("")
    .transform((v) => {
      const t = v.trim();
      if (!t) return null;
      const n = Number(t.replace(",", "."));
      return Number.isFinite(n) && n > 0 ? n : null;
    }),
  asCredit: z
    .union([z.literal("1"), z.literal("0"), z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "1" || v === "on"),
});

function mapError(message: string): string {
  const t = message.toLowerCase();
  if (t.includes("invalid_counter_title")) return "Başlık gerekli";
  if (t.includes("not_counter")) return "Bu işlem tezgâh siparişi için";
  if (t.includes("invalid_status")) return "Durum geçersiz";
  if (t.includes("not_desk")) return "Yetki yok";
  return message;
}

export async function acceptCounterOrderAction(
  _prev: CounterActionState,
  formData: FormData,
): Promise<CounterActionState> {
  await requireDeskSession();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const parsed = acceptSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    note: String(formData.get("note") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    asCredit: String(formData.get("asCredit") ?? ""),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { data, error } = await supabase.rpc("desk_accept_counter_order", {
    _title: parsed.data.title,
    _full_name: parsed.data.fullName,
    _phone: parsed.data.phone,
    _note: parsed.data.note,
    _amount: parsed.data.amount,
  });
  if (error) return { error: mapError(error.message) };

  const id =
    data && typeof data === "object" && "id" in data
      ? String((data as { id: string }).id)
      : null;

  if (id && parsed.data.asCredit && parsed.data.amount) {
    const { error: payError } = await supabase.rpc("desk_add_payment", {
      _work_order_id: id,
      _amount: parsed.data.amount,
      _method: "credit",
      _invoice_mode: "uninvoiced",
      _note: "Tezgâh veresiye",
    });
    if (payError) {
      redirect(`/jobs/${id}?warn=credit`);
    }
  }

  if (id) redirect(`/jobs/${id}`);
  redirect("/today");
}

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["intake", "in_progress", "ready", "delivered", "cancelled"]),
});

export async function setCounterStatusAction(
  _prev: CounterActionState,
  formData: FormData,
): Promise<CounterActionState> {
  await requireDeskSession();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const parsed = statusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { error } = await supabase.rpc("desk_set_counter_status", {
    _id: parsed.data.id,
    _status: parsed.data.status,
  });
  if (error) return { error: mapError(error.message) };
  redirect("/today");
}
