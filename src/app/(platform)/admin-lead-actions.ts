"use server";

import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/get-membership";
import { MISSING_SERVICE_ROLE, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  firstLeadZodError,
  updateLeadStatusSchema,
} from "@/lib/validations/leads";

export type AdminLeadActionState = {
  error: string | null;
};

export async function updateLeadStatusAction(
  _prev: AdminLeadActionState,
  formData: FormData,
): Promise<AdminLeadActionState> {
  await requirePlatformAdmin();

  const parsed = updateLeadStatusSchema.safeParse({
    leadId: String(formData.get("leadId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) return { error: firstLeadZodError(parsed.error) };

  const admin = createAdminSupabase();
  if (!admin) {
    return { error: MISSING_SERVICE_ROLE || MISSING_SUPABASE_ENV };
  }

  const { error } = await admin
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.leadId);

  if (error) return { error: error.message };
  redirect("/admin");
}
