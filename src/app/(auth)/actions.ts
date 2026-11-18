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
import { slugifyShopName } from "@/lib/format/slug";
import { getSiteUrl, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  message?: string | null;
};

function randomShopSuffix(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

function makeShopSlug(shopName: string): string {
  const base = slugifyShopName(shopName).slice(0, 44);
  return `${base}-${randomShopSuffix()}`;
}

async function callRegisterShop(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>,
  input: {
    shopName: string;
    fullName: string;
    phone: string;
    cityDistrict: string;
  },
): Promise<{ slug: string } | { error: string }> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = makeShopSlug(input.shopName);
    const { error } = await supabase.rpc("register_shop", {
      _name: input.shopName,
      _slug: slug,
      _full_name: input.fullName,
      _owner_phone: input.phone,
      _city_district: input.cityDistrict,
    });
    if (!error) return { slug };
    if (error.message.toLowerCase().includes("slug_taken") && attempt < 4) {
      continue;
    }
    return { error: mapAuthError(error.message) };
  }
  return { error: "Dükkan kodu üretilemedi. Tekrar dene." };
}

function mapAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("slug_taken")) return "Bu dükkan kodu alınmış";
  if (text.includes("already_registered")) {
    return "Bu cihazda zaten bir dükkan hesabı açık. Çıkış yapıp yeni e-posta ile dene, veya Panele git.";
  }
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

  const emailRaw = String(formData.get("email") ?? "").trim();
  const passwordRaw = String(formData.get("password") ?? "");
  const wantsEmailSignup = Boolean(emailRaw && passwordRaw);

  let {
    data: { user },
  } = await supabase.auth.getUser();

  // E-posta + şifre ile yeni dükkan: önceki demo/oturumu temizle
  if (wantsEmailSignup) {
    if (user) {
      await supabase.auth.signOut({ scope: "global" });
      user = null;
    }

    const parsed = registerSchema.safeParse({
      fullName: String(formData.get("fullName") ?? ""),
      shopName: String(formData.get("shopName") ?? ""),
      cityDistrict: String(formData.get("cityDistrict") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: emailRaw,
      password: passwordRaw,
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
      return {
        error:
          "Hesap oluştu ama oturum açılamadı. Supabase’te e-posta onayı kapalı olmalı; ardından giriş yap.",
      };
    }

    const result = await callRegisterShop(supabase, {
      shopName: parsed.data.shopName,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      cityDistrict: parsed.data.cityDistrict,
    });
    if ("error" in result) return { error: result.error };

    redirect(`/today?shopCode=${encodeURIComponent(result.slug)}`);
  }

  // Google / mevcut oturum ile dükkan tamamlama (e-posta alanı yok)
  if (!user) {
    return { error: "Oturum bulunamadı. Google ile devam et veya e-posta ile kayıt ol." };
  }

  const parsed = oauthRegisterSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    shopName: String(formData.get("shopName") ?? ""),
    cityDistrict: String(formData.get("cityDistrict") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const existing = await getSessionContext();
  if (existing) {
    return {
      error:
        "Bu hesap zaten bir dükkana bağlı. Panele git, veya /register/fresh ile yeni hesap aç.",
    };
  }

  const result = await callRegisterShop(supabase, parsed.data);
  if ("error" in result) return { error: result.error };
  redirect(`/today?shopCode=${encodeURIComponent(result.slug)}`);
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
