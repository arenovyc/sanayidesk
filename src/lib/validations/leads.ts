import { z } from "zod";

export const leadStatusSchema = z.enum(["new", "contacted", "closed"]);

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Ad gerekli").max(80),
  shopName: z.string().trim().min(2, "Dükkan adı gerekli").max(80),
  city: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().max(32).optional().default(""),
  email: z.email("E-posta geçersiz"),
  note: z.string().trim().max(500).optional().default(""),
});

export const updateLeadStatusSchema = z.object({
  leadId: z.uuid(),
  status: leadStatusSchema,
});

export function firstLeadZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz form";
}
