import { z } from "zod";

export const inventoryUpsertSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Ad gerekli"),
  sku: z.string().trim().max(64).optional().default(""),
  unitCost: z.coerce.number().min(0, "Maliyet negatif olamaz"),
  minQty: z.coerce.number().min(0, "Min stok negatif olamaz"),
  initialQty: z.coerce.number().min(0, "Açılış stoğu negatif olamaz").optional(),
});

export const inventoryMoveSchema = z.object({
  itemId: z.uuid("Stok kalemi gerekli"),
  kind: z.enum(["in", "out", "adjust"]),
  qty: z.coerce.number().positive("Miktar pozitif olmalı"),
  workOrderId: z.string().uuid().optional().or(z.literal("")),
  note: z.string().trim().max(200).optional().default(""),
});

export const quoteAmountSchema = z.object({
  workOrderId: z.uuid(),
  quoteAmount: z.union([
    z.null(),
    z.coerce.number().min(0, "Teklif negatif olamaz"),
  ]),
});

export function firstInventoryZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}
