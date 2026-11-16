"use server";

import { redirect } from "next/navigation";
import { homeForRole } from "@/lib/auth/roles";
import { getSessionContext } from "@/lib/auth/get-membership";
import {
  changePasswordSchema,
  firstZodError,
  forgotPasswordSchema,
  loginSchema,
  oauthRegisterSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { passwordLoginHint } from "@/lib/auth/login-hint";
import { getSiteUrl, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  message?: string | null;
};

function mapAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("slug_taken")) return "Bu dükkan kodu alınmış";
  if (text.includes("already_registered")) return "Bu hesap zaten bir dükkana bağlı";
  if (text.includes("invalid_slug")) return "Dükkan kodu geçersiz";
  if (text.includes("invalid login") || text.includes("invalid credentials")) {
    return "E-posta veya şifre yanlış.";
  }
  if (text.includes("email not confirmed")) {
    return "E-posta onayı gerekli. Gelen kutundaki bağlantıya tıkla.";
  }
  if (text.includes("user already registered")) {
    return "Bu e-posta zaten kayıtlı. Giriş yap veya şifreni sıfırla.";
  }
  if (text.includes("same password")) {
    return "Yeni şifre eskisiyle aynı olamaz";
  }
  return message;
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    remember: formData.get("remember") === "on",
  });
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect("/auth/confirm-pending");
    }
    const text = error.message.toLowerCase();
    if (text.includes("invalid login") || text.includes("invalid credentials")) {
      const hint = await passwordLoginHint(parsed.data.email);
      return { error: hint };
    }
    return { error: mapAuthError(error.message) };
  }

  const ctx = await getSessionContext();
  if (!ctx) redirect("/register");
  redirect(homeForRole(ctx.membership.role));
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const parsed = oauthRegisterSchema.safeParse({
      fullName: String(formData.get("fullName") ?? ""),
      shopName: String(formData.get("shopName") ?? ""),
      slug: String(formData.get("slug") ?? ""),
    });
    if (!parsed.success) {
      return { error: firstZodError(parsed.error) };
    }

    const { error: rpcError } = await supabase.rpc("register_shop", {
      _name: parsed.data.shopName,
      _slug: parsed.data.slug,
      _full_name: parsed.data.fullName,
    });
    if (rpcError) {
      return { error: mapAuthError(rpcError.message) };
    }
    redirect("/welcome");
  }

  const parsed = registerSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    shopName: String(formData.get("shopName") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const siteUrl = getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/register`,
    },
  });
  if (error) {
    return { error: mapAuthError(error.message) };
  }
  user = data.user;
  if (!data.session || !user) {
    redirect("/auth/confirm-pending");
  }

  const { error: rpcError } = await supabase.rpc("register_shop", {
    _name: parsed.data.shopName,
    _slug: parsed.data.slug,
    _full_name: parsed.data.fullName,
  });
  if (rpcError) {
    return { error: mapAuthError(rpcError.message) };
  }

  redirect("/welcome");
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const siteUrl = getSiteUrl();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  return {
    error: null,
    message:
      "E-posta gönderildiyse gelen kutunu kontrol et. Bağlantı birkaç dakika içinde gelir.",
  };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Oturum yok. Şifre sıfırlama e-postasındaki bağlantıyı yeniden aç.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: mapAuthError(error.message) };
  }

  const ctx = await getSessionContext();
  if (!ctx) redirect("/register");
  redirect(homeForRole(ctx.membership.role));
}

export async function changePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Oturum bulunamadı" };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return { error: "Mevcut şifre yanlış" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { error: null, message: "Şifre güncellendi" };
}

export async function logoutAction() {
  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut({ scope: "global" });
  }
  redirect("/");
}
