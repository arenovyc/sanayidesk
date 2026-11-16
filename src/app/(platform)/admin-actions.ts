"use server";

import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/get-membership";
import { MISSING_SERVICE_ROLE, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { z } from "zod";

export type AdminActionState = {
  error: string | null;
};

const updateSchema = z.object({
  workspaceId: z.uuid(),
  plan: z.string().trim().min(1).max(40),
  isSuspended: z.enum(["true", "false"]),
  trialEndsAt: z.string().trim().optional().default(""),
});

export async function updateWorkspaceAdminAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePlatformAdmin();

  const parsed = updateSchema.safeParse({
    workspaceId: String(formData.get("workspaceId") ?? ""),
    plan: String(formData.get("plan") ?? "trial"),
    isSuspended: String(formData.get("isSuspended") ?? "false"),
    trialEndsAt: String(formData.get("trialEndsAt") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  const admin = createAdminSupabase();
  if (!admin) {
    return { error: MISSING_SERVICE_ROLE || MISSING_SUPABASE_ENV };
  }

  const trialEndsAt = parsed.data.trialEndsAt
    ? new Date(parsed.data.trialEndsAt).toISOString()
    : null;
  if (parsed.data.trialEndsAt && Number.isNaN(Date.parse(parsed.data.trialEndsAt))) {
    return { error: "Deneme tarihi geçersiz" };
  }

  const { error } = await admin
    .from("workspaces")
    .update({
      plan: parsed.data.plan,
      is_suspended: parsed.data.isSuspended === "true",
      trial_ends_at: trialEndsAt,
    })
    .eq("id", parsed.data.workspaceId);

  if (error) return { error: error.message };
  redirect("/admin");
}
