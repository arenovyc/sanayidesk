"use server";

import { redirect } from "next/navigation";
import { sendLeadEmails } from "@/lib/email/leads";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  createLeadSchema,
  firstLeadZodError,
} from "@/lib/validations/leads";

export type ApplyActionState = {
  error: string | null;
};

export async function submitLeadAction(
  _prev: ApplyActionState,
  formData: FormData,
): Promise<ApplyActionState> {
  // Honeypot filled → pretend success
  if (String(formData.get("companyWebsite") ?? "").trim()) {
    redirect("/apply?ok=1");
  }

  const parsed = createLeadSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    shopName: String(formData.get("shopName") ?? ""),
    city: String(formData.get("city") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: firstLeadZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.from("leads").insert({
    name: parsed.data.name,
    shop_name: parsed.data.shopName,
    city: parsed.data.city,
    phone: parsed.data.phone,
    email: parsed.data.email,
    note: parsed.data.note,
    status: "new",
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("does not exist") ||
      msg.includes("schema cache") ||
      msg.includes("leads")
    ) {
      return { error: "Başvuru şeması eksik. npm run db:push (011)." };
    }
    return { error: error.message };
  }

  try {
    await sendLeadEmails(parsed.data);
  } catch {
    // Mail opsiyonel; başvuru DB'de — kullanıcıya yine başarı göster.
  }

  redirect("/apply?ok=1");
}
