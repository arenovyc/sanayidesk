import "server-only";
import {
  istanbulMonthStartYmd,
  istanbulTodayYmd,
  rangeFromStartIso,
  rangeToInclusiveEndIso,
} from "@/lib/reports/range";
import { createServerSupabase } from "@/lib/supabase/server";
import { requestNow } from "@/lib/time/request-now";
import { OPEN_STATUSES } from "@/lib/work-orders/status";

export type ReportSummary = {
  from: string;
  to: string;
  openJobs: number;
  collected: number;
  creditBooked: number;
  customerDebtTotal: number;
  b2bNetTotal: number;
};

export type ReportPaymentRow = {
  id: string;
  paidAt: string;
  amount: number;
  method: string;
  voidedAt: string | null;
  plate: string;
  displayNo: string | null;
};

export async function defaultReportRange() {
  const today = istanbulTodayYmd(await requestNow());
  return {
    from: istanbulMonthStartYmd(today),
    to: today,
  };
}

export async function getReportSummary(
  workspaceId: string,
  from: string,
  to: string,
): Promise<ReportSummary> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return {
      from,
      to,
      openJobs: 0,
      collected: 0,
      creditBooked: 0,
      customerDebtTotal: 0,
      b2bNetTotal: 0,
    };
  }

  const fromIso = rangeFromStartIso(from);
  const toIso = rangeToInclusiveEndIso(to);

  const [openRes, payRes, ledgerRes, b2bRes] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("status", [...OPEN_STATUSES]),
    supabase
      .from("payments")
      .select("amount, method, voided_at")
      .eq("workspace_id", workspaceId)
      .gte("paid_at", fromIso)
      .lte("paid_at", toIso),
    supabase
      .from("customer_ledger_entries")
      .select("delta")
      .eq("workspace_id", workspaceId),
    supabase
      .from("b2b_party_balances")
      .select("net")
      .eq("workspace_id", workspaceId),
  ]);

  if (openRes.error) throw openRes.error;
  if (payRes.error && !isMissing(payRes.error)) throw payRes.error;
  if (ledgerRes.error && !isMissing(ledgerRes.error)) throw ledgerRes.error;
  if (b2bRes.error && !isMissing(b2bRes.error)) throw b2bRes.error;

  let collected = 0;
  let creditBooked = 0;
  for (const row of payRes.data ?? []) {
    if (row.voided_at) continue;
    const amount = Number(row.amount);
    if (!Number.isFinite(amount)) continue;
    if (row.method === "credit") creditBooked += amount;
    else collected += amount;
  }

  let customerDebtTotal = 0;
  for (const row of ledgerRes.data ?? []) {
    const delta = Number(row.delta);
    if (Number.isFinite(delta)) customerDebtTotal += delta;
  }

  let b2bNetTotal = 0;
  for (const row of b2bRes.data ?? []) {
    const net = Number((row as { net?: number }).net);
    if (Number.isFinite(net)) b2bNetTotal += net;
  }

  return {
    from,
    to,
    openJobs: openRes.count ?? 0,
    collected: round2(collected),
    creditBooked: round2(creditBooked),
    customerDebtTotal: round2(customerDebtTotal),
    b2bNetTotal: round2(b2bNetTotal),
  };
}

export async function listReportPayments(
  workspaceId: string,
  from: string,
  to: string,
): Promise<ReportPaymentRow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, method, paid_at, voided_at, work_orders(display_no, vehicles(plate_normalized))",
    )
    .eq("workspace_id", workspaceId)
    .gte("paid_at", rangeFromStartIso(from))
    .lte("paid_at", rangeToInclusiveEndIso(to))
    .order("paid_at", { ascending: false })
    .limit(500);

  if (error) {
    if (isMissing(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => {
    const embedded = row.work_orders as unknown;
    const wo = Array.isArray(embedded)
      ? (embedded[0] as
          | {
              display_no: string | null;
              vehicles:
                | { plate_normalized: string }
                | { plate_normalized: string }[]
                | null;
            }
          | undefined)
      : (embedded as
          | {
              display_no: string | null;
              vehicles:
                | { plate_normalized: string }
                | { plate_normalized: string }[]
                | null;
            }
          | null);
    const vehicle = wo?.vehicles;
    const plate = Array.isArray(vehicle)
      ? (vehicle[0]?.plate_normalized ?? "—")
      : (vehicle?.plate_normalized ?? "—");
    return {
      id: row.id as string,
      paidAt: row.paid_at as string,
      amount: Number(row.amount),
      method: row.method as string,
      voidedAt: (row.voided_at as string | null) ?? null,
      plate,
      displayNo: wo?.display_no ?? null,
    };
  });
}

export function paymentsToCsv(rows: ReportPaymentRow[]): string {
  const header = ["paid_at", "plate", "display_no", "method", "amount", "voided"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.paidAt,
        csvEscape(row.plate),
        csvEscape(row.displayNo ?? ""),
        row.method,
        String(row.amount),
        row.voidedAt ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function isMissing(error: { code?: string; message?: string }) {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}
