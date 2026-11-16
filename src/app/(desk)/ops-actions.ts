"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import {
  MISSING_SERVICE_ROLE,
  MISSING_SUPABASE_ENV,
} from "@/lib/supabase/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  addAdvisorSchema,
  addPinMemberSchema,
  directorySchema,
  firstOpsZodError,
  setMemberPinSchema,
  shopNameSchema,
  shopProfileSchema,
} from "@/lib/validations/ops";

export type OpsActionState = {
  error: string | null;
};

function mapOpsError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("not_owner")) return "Yalnız patron yapabilir";
  if (text.includes("invalid_pin")) return "PIN 4 haneli olmalı";
  if (text.includes("invalid_name")) return "Ad geçersiz";
  if (text.includes("invalid_role")) return "Rol geçersiz";
  if (text.includes("cannot_disable_owner")) return "Patron pasif yapılamaz";
  if (text.includes("not_found")) return "Kayıt bulunamadı";
  return message;
}

async function requireOwner() {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") redirect("/more");
  return ctx;
}

export async function addPinMemberAction(
  _prev: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  await requireOwner();
  const parsed = addPinMemberSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    role: String(formData.get("role") ?? "mechanic"),
    pin: String(formData.get("pin") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_add_pin_member", {
    _display_name: parsed.data.displayName,
    _role: parsed.data.role,
    _pin: parsed.data.pin,
  });
  if (error) return { error: mapOpsError(error.message) };

  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (
    returnTo === "/team" ||
    returnTo === "/today" ||
    returnTo === "/welcome" ||
    returnTo.startsWith("/welcome?")
  ) {
    redirect(returnTo);
  }
  redirect("/team");
}

export async function setMemberPinAction(
  _prev: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  await requireOwner();
  const parsed = setMemberPinSchema.safeParse({
    membershipId: String(formData.get("membershipId") ?? ""),
    pin: String(formData.get("pin") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_set_member_pin", {
    _membership_id: parsed.data.membershipId,
    _pin: parsed.data.pin,
  });
  if (error) return { error: mapOpsError(error.message) };
  redirect("/team");
}

export async function setMemberActiveAction(
  _prev: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  await requireOwner();
  const membershipId = String(formData.get("membershipId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!membershipId) return { error: "Üye gerekli" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_set_member_active", {
    _membership_id: membershipId,
    _active: active,
  });
  if (error) return { error: mapOpsError(error.message) };
  redirect("/team");
}

export async function addAdvisorAction(
  _prev: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  const ctx = await requireOwner();
  const parsed = addAdvisorSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const admin = createAdminSupabase();
  if (!admin) return { error: MISSING_SERVICE_ROLE };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.displayName },
  });
  if (createError || !created.user) {
    return { error: createError?.message ?? "Kullanıcı oluşturulamadı" };
  }

  const { data: appUser, error: userError } = await admin
    .from("users")
    .insert({
      auth_user_id: created.user.id,
      full_name: parsed.data.displayName,
    })
    .select("id")
    .single();
  if (userError || !appUser) {
    return { error: userError?.message ?? "Profil oluşturulamadı" };
  }

  const { error: memError } = await admin.from("memberships").insert({
    user_id: appUser.id,
    workspace_id: ctx.workspace.id,
    role: "advisor",
    display_name: parsed.data.displayName,
  });
  if (memError) return { error: memError.message };
  redirect("/team");
}

export async function updateShopNameAction(
  _prev: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  await requireOwner();
  const parsed = shopProfileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_update_shop_profile", {
    _name: parsed.data.name,
    _phone: parsed.data.phone || null,
    _address: parsed.data.address || null,
  });
  if (error) {
    // Pre-008 fallback: name only
    if (
      error.message.toLowerCase().includes("owner_update_shop_profile") ||
      error.message.toLowerCase().includes("could not find")
    ) {
      const legacy = shopNameSchema.safeParse({ name: parsed.data.name });
      if (!legacy.success) return { error: firstOpsZodError(legacy.error) };
      const { error: nameError } = await supabase.rpc("owner_update_shop_name", {
        _name: legacy.data.name,
      });
      if (nameError) return { error: mapOpsError(nameError.message) };
      redirect("/settings");
    }
    return { error: mapOpsError(error.message) };
  }
  redirect("/settings");
}

export async function addDirectoryContactAction(
  _prev: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  const ctx = await requireDeskSession();
  const parsed = directorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.from("directory_contacts").insert({
    workspace_id: ctx.workspace.id,
    name: parsed.data.name,
    phone: parsed.data.phone,
    note: parsed.data.note,
  });
  if (error) return { error: error.message };
  redirect("/directory");
}

export async function deleteDirectoryContactAction(
  _prev: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  await requireDeskSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Kayıt gerekli" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.from("directory_contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  redirect("/directory");
}
