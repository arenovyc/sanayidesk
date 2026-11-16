"use server";

import { redirect } from "next/navigation";
import { homeForRole, type MembershipRole } from "@/lib/auth/roles";
import {
  clearStaffCookie,
  readStaffToken,
  setStaffCookie,
} from "@/lib/auth/staff-session";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export type PinActionState = {
  error: string | null;
};

function mapPinError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("pin_locked")) {
    return "PIN kilitli. 15 dakika sonra tekrar dene.";
  }
  if (text.includes("invalid_credentials") || text.includes("invalid_pin")) {
    return "Dükkan kodu veya PIN yanlış";
  }
  return message;
}

export async function pinLoginAction(
  _prev: PinActionState,
  formData: FormData,
): Promise<PinActionState> {
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!slug) return { error: "Dükkan kodu gerekli" };
  if (!/^\d{4}$/.test(pin)) return { error: "PIN 4 haneli olmalı" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { data, error } = await supabase.rpc("pin_login", {
    _slug: slug,
    _pin: pin,
  });
  if (error) return { error: mapPinError(error.message) };

  const result = data as {
    token?: string;
    role?: MembershipRole;
  } | null;
  if (!result?.token || !result.role) {
    return { error: "Giriş başarısız" };
  }

  await setStaffCookie(result.token);
  redirect(homeForRole(result.role));
}

export async function pinLogoutAction() {
  const token = await readStaffToken();
  const supabase = await createServerSupabase();
  if (supabase && token) {
    await supabase.rpc("pin_logout", { _token: token });
  }
  await clearStaffCookie();
  redirect("/pin");
}
