import { z } from "zod";
import { normalizePhone } from "@/lib/format/phone";
import { normalizePlate } from "@/lib/format/plate";
import { isWorkOrderStatus } from "@/lib/work-orders/status";

const PLATE_KEY = /^[A-Z0-9]{3,12}$/;

export const acceptWorkOrderSchema = z.object({
  plate: z
    .string()
    .transform((value) => normalizePlate(value))
    .refine((value) => PLATE_KEY.test(value), "Plaka 3–12 harf veya rakam olmalı"),
  fullName: z.string().trim().max(80).optional().default(""),
  phone: z
    .string()
    .optional()
    .default("")
    .transform((value) => normalizePhone(value))
    .refine((value) => value === "" || value.length >= 7, "Telefon en az 7 rakam olmalı"),
  complaint: z.string().trim().max(500).optional().default(""),
});

export const setWorkOrderStatusSchema = z.object({
  id: z.uuid("İş emri bulunamadı"),
  status: z.string().refine(isWorkOrderStatus, "Durum geçersiz"),
  returnTo: z.string().trim().optional().default(""),
  allowUnpaid: z
    .union([z.boolean(), z.literal("1"), z.literal("0"), z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === true || value === "1" || value === "true"),
  setRemind: z
    .union([z.boolean(), z.literal("1"), z.literal("0"), z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === true || value === "1" || value === "true"),
});

export const clearWorkOrderRemindSchema = z.object({
  id: z.uuid("İş emri bulunamadı"),
  returnTo: z.string().trim().optional().default(""),
});

export const shareQuoteApprovalSchema = z.object({
  id: z.uuid("İş emri bulunamadı"),
  preview: z.string().trim().max(2000).optional().default(""),
});

export const updateJobIntakeSchema = z.object({
  workOrderId: z.uuid("İş emri bulunamadı"),
  fullName: z.string().trim().max(80).optional().default(""),
  phone: z
    .string()
    .optional()
    .default("")
    .transform((value) => normalizePhone(value))
    .refine((value) => value === "" || value.length >= 7, "Telefon en az 7 rakam olmalı"),
  complaint: z.string().trim().max(500).optional().default(""),
  makeModel: z.string().trim().max(80).optional().default(""),
  entryKm: z
    .union([z.number(), z.nan(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null || (typeof value === "number" && Number.isNaN(value))) {
        return null;
      }
      return value;
    })
    .refine(
      (value) => value == null || (Number.isInteger(value) && value >= 0),
      "Giriş KM geçersiz",
    ),
});

export function firstWorkOrderZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}
