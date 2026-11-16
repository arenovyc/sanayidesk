import { z } from "zod";

export const pinSchema = z.string().regex(/^\d{4}$/, "PIN 4 haneli olmalı");

export const addItemSchema = z.object({
  workOrderId: z.uuid(),
  kind: z.enum(["labor", "part", "other"]),
  description: z.string().trim().min(1, "Açıklama gerekli").max(200),
  amount: z.coerce.number().positive("Tutar 0’dan büyük olmalı"),
});

export const addPaymentSchema = z.object({
  workOrderId: z.uuid(),
  amount: z.coerce.number().positive("Tutar 0’dan büyük olmalı"),
  method: z.enum(["cash", "card", "transfer", "credit"]),
  invoiceMode: z.enum(["invoiced", "uninvoiced"]),
  note: z.string().trim().max(200).optional().default(""),
});

export const addPartSchema = z.object({
  workOrderId: z.uuid(),
  description: z.string().trim().min(1).max(200),
});

export const directorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(32).optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
});

export const addPinMemberSchema = z.object({
  displayName: z.string().trim().min(2, "Ad en az 2 karakter"),
  role: z.enum(["mechanic", "apprentice"]),
  pin: pinSchema,
});

export const setMemberPinSchema = z.object({
  membershipId: z.uuid(),
  pin: pinSchema,
});

export const addAdvisorSchema = z.object({
  displayName: z.string().trim().min(2),
  email: z.email("E-posta geçersiz"),
  password: z.string().min(8, "Şifre en az 8 karakter"),
});

export const shopNameSchema = z.object({
  name: z.string().trim().min(2, "Dükkan adı gerekli").max(80),
});

export const shopProfileSchema = z.object({
  name: z.string().trim().min(2, "Dükkan adı gerekli").max(80),
  phone: z.string().trim().max(32).optional().default(""),
  address: z.string().trim().max(200).optional().default(""),
});

export const voidPaymentSchema = z.object({
  paymentId: z.uuid(),
  workOrderId: z.uuid(),
});

export const mediaUploadSchema = z.object({
  workOrderId: z.uuid(),
});

export const externalPartySchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(32).optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
  linkedDirectoryId: z.uuid().optional().nullable(),
  linkedWorkspaceId: z.uuid().optional().nullable(),
});

export const createB2bEntrySchema = z.object({
  externalPartyId: z.uuid(),
  amount: z.coerce.number().positive("Tutar 0’dan büyük olmalı"),
  direction: z.enum(["we_owe", "they_owe"]),
  note: z.string().trim().max(200).optional().default(""),
  workOrderId: z.uuid().optional().nullable(),
});

export const b2bDecisionSchema = z.object({
  entryId: z.uuid(),
});

export const assignWorkOrderSchema = z.object({
  workOrderId: z.uuid(),
  membershipId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.uuid().nullable()),
  returnTo: z.string().trim().optional().default("/board"),
});

export const addMechanicBonusSchema = z.object({
  workOrderId: z.uuid(),
  membershipId: z.uuid(),
  amount: z.coerce.number().positive("Tutar 0’dan büyük olmalı"),
  note: z.string().trim().max(200).optional().default(""),
});

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export function firstOpsZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}
