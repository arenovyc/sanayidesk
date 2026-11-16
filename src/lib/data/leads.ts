import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

export type LeadRow = {
  id: string;
  name: string;
  shopName: string;
  city: string;
  phone: string;
  email: string;
  note: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
};

export async function listLeadsAdmin(): Promise<{
  rows: LeadRow[];
  error: string | null;
  schemaMissing: boolean;
}> {
  const admin = createAdminSupabase();
  if (!admin) {
    return { rows: [], error: "Service role yapılandırılmamış", schemaMissing: false };
  }

  const { data, error } = await admin
    .from("leads")
    .select("id, name, shop_name, city, phone, email, note, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (
      msg.includes("does not exist") ||
      msg.includes("schema cache") ||
      msg.includes("leads")
    ) {
      return { rows: [], error: null, schemaMissing: true };
    }
    return { rows: [], error: error.message, schemaMissing: false };
  }

  return {
    error: null,
    schemaMissing: false,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      shopName: row.shop_name,
      city: row.city ?? "",
      phone: row.phone ?? "",
      email: row.email,
      note: row.note ?? "",
      status: row.status as LeadRow["status"],
      createdAt: row.created_at,
    })),
  };
}
