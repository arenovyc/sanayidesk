import { z } from "zod";

export const requestTransferSchema = z.object({
  fromItemId: z.uuid(),
  toWorkspaceId: z.uuid(),
  qty: z.coerce.number().positive("Miktar 0’dan büyük olmalı"),
  note: z.string().trim().max(300).optional().default(""),
});

export const respondTransferSchema = z.object({
  requestId: z.uuid(),
  approve: z.enum(["true", "false"]),
});

export const cancelTransferSchema = z.object({
  requestId: z.uuid(),
});

export function firstTransferZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz form";
}
