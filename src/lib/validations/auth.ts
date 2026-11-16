import { z } from "zod";
import { isValidShopSlug } from "@/lib/format/slug";

export const loginSchema = z.object({
  email: z.email("E-posta geçersiz"),
  password: z.string().min(1, "Şifre gerekli"),
  remember: z.boolean(),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Ad en az 2 karakter"),
  shopName: z.string().trim().min(2, "Dükkan adı gerekli"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidShopSlug, "Kod yalnızca küçük harf, rakam ve tire olabilir"),
  email: z.email("E-posta geçersiz"),
  password: z.string().min(8, "Şifre en az 8 karakter"),
});

/** Google / mevcut oturum ile dükkan aç — e-posta ve şifre session’dan gelir */
export const oauthRegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Ad en az 2 karakter"),
  shopName: z.string().trim().min(2, "Dükkan adı gerekli"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidShopSlug, "Kod yalnızca küçük harf, rakam ve tire olabilir"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("E-posta geçersiz"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Şifre en az 8 karakter"),
    confirmPassword: z.string().min(1, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
    password: z.string().min(8, "Yeni şifre en az 8 karakter"),
    confirmPassword: z.string().min(1, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}
