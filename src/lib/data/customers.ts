import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { displayPlate } from "@/lib/format/plate";
import { isWorkOrderStatus, type WorkOrderStatus } from "@/lib/work-orders/status";

export type CustomerListRow = {
  id: string;
  fullName: string;
  phone: string | null;
  balance: number;
};

export type CustomerDetail = CustomerListRow & {
  jobs: {
    id: string;
    plate: string;
    displayNo: string | null;
    status: WorkOrderStatus;
    openedAt: string;
  }[];
  ledger: { id: string; delta: number; note: string; createdAt: string }[];
};

export async function listCustomers(workspaceId: string): Promise<CustomerListRow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .eq("workspace_id", workspaceId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  if (!customers?.length) return [];

  const ids = customers.map((c) => c.id);
  const { data: ledger, error: ledgerError } = await supabase
    .from("customer_ledger_entries")
    .select("customer_id, delta")
    .in("customer_id", ids);

  if (ledgerError) throw ledgerError;

  const balances = new Map<string, number>();
  for (const entry of ledger ?? []) {
    balances.set(
      entry.customer_id,
      (balances.get(entry.customer_id) ?? 0) + Number(entry.delta),
    );
  }

  return customers.map((customer) => ({
    id: customer.id,
    fullName: customer.full_name || "Müşteri",
    phone: customer.phone,
    balance: Math.round((balances.get(customer.id) ?? 0) * 100) / 100,
  }));
}

export async function getCustomer(
  workspaceId: string,
  id: string,
): Promise<CustomerDetail | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!customer) return null;

  const [ledgerRes, jobsRes] = await Promise.all([
    supabase
      .from("customer_ledger_entries")
      .select("id, delta, note, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("work_orders")
      .select("id, status, opened_at, display_no, vehicles(plate_normalized)")
      .eq("workspace_id", workspaceId)
      .eq("customer_id", id)
      .order("opened_at", { ascending: false })
      .limit(30),
  ]);

  if (ledgerRes.error) throw ledgerRes.error;
  if (jobsRes.error) throw jobsRes.error;

  const ledger = (ledgerRes.data ?? []).map((row) => ({
    id: row.id,
    delta: Number(row.delta),
    note: row.note,
    createdAt: row.created_at,
  }));
  const balance =
    Math.round(ledger.reduce((sum, row) => sum + row.delta, 0) * 100) / 100;

  const jobs = (jobsRes.data ?? [])
    .map((row) => {
      const status = isWorkOrderStatus(row.status) ? row.status : null;
      const vehicle = Array.isArray(row.vehicles) ? row.vehicles[0] : row.vehicles;
      if (!status || !vehicle) return null;
      return {
        id: row.id,
        plate: displayPlate((vehicle as { plate_normalized: string }).plate_normalized),
        displayNo:
          "display_no" in row
            ? ((row as { display_no: string | null }).display_no ?? null)
            : null,
        status,
        openedAt: row.opened_at,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return {
    id: customer.id,
    fullName: customer.full_name || "Müşteri",
    phone: customer.phone,
    balance,
    jobs,
    ledger,
  };
}
