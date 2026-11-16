import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("E-posta geçersiz"),
  password: z.string().min(1, "Şifre gerekli"),
  remember: z.boolean(),
});

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Cep telefonu gerekli")
  .max(20, "Telefon çok uzun")
  .refine((value) => value.replace(/\D/g, "").length >= 10, "Geçerli bir cep numarası gir");

const shopFields = {
  fullName: z.string().trim().min(2, "Ad en az 2 karakter"),
  shopName: z.string().trim().min(2, "Dükkan adı gerekli"),
  cityDistrict: z.string().trim().min(2, "İl / İlçe gerekli"),
  phone: phoneSchema,
};

export const registerSchema = z.object({
  ...shopFields,
  email: z.email("E-posta geçersiz"),
  password: z.string().min(8, "Şifre en az 8 karakter"),
});

/** Google / mevcut oturum ile dükkan aç — e-posta ve şifre session’dan gelir */
export const oauthRegisterSchema = z.object({
  ...shopFields,
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
