import { z } from "zod";

export const reportRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Başlangıç tarihi geçersiz"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitiş tarihi geçersiz"),
});

export function firstReportsZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}
