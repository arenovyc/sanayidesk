import "server-only";
import {
  listActiveAssignments,
  listMoneyOpen,
} from "@/lib/data/assignments";
import { displayPlate, normalizePlate } from "@/lib/format/plate";
import { waitLabel } from "@/lib/format/wait-label";
import { matchesJobQuery, parseJobQuery } from "@/lib/search/job-query";
import { createServerSupabase } from "@/lib/supabase/server";
import { requestNowMs } from "@/lib/time/request-now";
import { boardColumnForStatus } from "@/lib/assignments/rules";
import {
  bucketForStatus,
  isOpenStatus,
  isWorkOrderStatus,
  OPEN_STATUSES,
  type TodayBucket,
  type WorkOrderStatus,
} from "@/lib/work-orders/status";
import { sumPaidAmount } from "@/lib/work-orders/money";
import type {
  VehicleCheckup,
  BoardCard,
  JobsBoard,
  MediaRow,
  PartRequestRow,
  PaymentRow,
  MaintenanceReminderRow,
  StatusBoard,
  TodayBoard,
  VehicleRow,
  WorkOrderDetail,
  WorkOrderItemRow,
  WorkOrderRow,
} from "@/lib/work-orders/types";

type Nested<T> = T | T[] | null;

type VehicleEmbed = {
  id: string;
  plate_normalized: string;
  make_model?: string | null;
};
type CustomerEmbed = { id: string; full_name: string; phone: string | null };
type WorkOrderEmbed = {
  id: string;
  status: string;
  opened_at: string;
};

type WorkOrderQuery = {
  id: string;
  status: string;
  complaint: string;
  opened_at: string;
  closed_at: string | null;
  display_no: string | null;
  remind_at?: string | null;
  counter_title?: string | null;
  vehicle: Nested<VehicleEmbed>;
  customer: Nested<CustomerEmbed>;
};

function one<T>(value: Nested<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asStatus(value: string): WorkOrderStatus | null {
  return isWorkOrderStatus(value) ? value : null;
}

function toRow(row: WorkOrderQuery): WorkOrderRow | null {
  const status = asStatus(row.status);
  if (!status) return null;
  const vehicle = one(row.vehicle);
  const counterTitle = row.counter_title?.trim() || null;
  if (!vehicle && !counterTitle) return null;
  const customer = one(row.customer);
  const name = customer?.full_name.trim() || null;
  const phone = customer?.phone || null;
  return {
    id: row.id,
    status,
    complaint: row.complaint,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    plate: vehicle ? displayPlate(vehicle.plate_normalized) : "",
    counterTitle,
    displayNo: row.display_no,
    makeModel: vehicle?.make_model?.trim() || null,
    customerId: customer?.id ?? null,
    customerName: name,
    customerPhone: phone,
    remindAt: row.remind_at ?? null,
  };
}

const WORK_ORDER_SELECT = `
  id,
  status,
  complaint,
  opened_at,
  closed_at,
  display_no,
  remind_at,
  counter_title,
  vehicle:vehicles(id, plate_normalized, make_model),
  customer:customers(id, full_name, phone)
`;

const WORK_ORDER_SELECT_LEGACY = `
  id,
  status,
  complaint,
  opened_at,
  closed_at,
  vehicle:vehicles(id, plate_normalized),
  customer:customers(id, full_name, phone)
`;

const WORK_ORDER_SELECT_NO_MAKE = `
  id,
  status,
  complaint,
  opened_at,
  closed_at,
  display_no,
  counter_title,
  vehicle:vehicles(id, plate_normalized),
  customer:customers(id, full_name, phone)
`;

const WORK_ORDER_SELECT_NO_REMIND = `
  id,
  status,
  complaint,
  opened_at,
  closed_at,
  display_no,
  counter_title,
  vehicle:vehicles(id, plate_normalized, make_model),
  customer:customers(id, full_name, phone)
`;

const WORK_ORDER_SELECT_NO_COUNTER = `
  id,
  status,
  complaint,
  opened_at,
  closed_at,
  display_no,
  remind_at,
  vehicle:vehicles(id, plate_normalized, make_model),
  customer:customers(id, full_name, phone)
`;

function isMissingColumn(error: { message?: string } | null, column: string) {
  const msg = (error?.message ?? "").toLowerCase();
  return msg.includes(column.toLowerCase()) && msg.includes("does not exist");
}

export async function getTodayBoard(workspaceId: string): Promise<TodayBoard> {
  const empty: TodayBoard = {
    counts: { inside: 0, parts: 0, ready: 0 },
    jobs: [],
  };
  const supabase = await createServerSupabase();
  if (!supabase) return empty;

  let { data, error } = await supabase
    .from("work_orders")
    .select(WORK_ORDER_SELECT)
    .eq("workspace_id", workspaceId)
    .in("status", [...OPEN_STATUSES])
    .order("opened_at", { ascending: false });

  if (error && isMissingColumn(error, "counter_title")) {
    const noCounter = await supabase
      .from("work_orders")
      .select(WORK_ORDER_SELECT_NO_COUNTER)
      .eq("workspace_id", workspaceId)
      .in("status", [...OPEN_STATUSES])
      .order("opened_at", { ascending: false });
    data = (noCounter.data ?? []).map((row) => ({
      ...row,
      counter_title: null,
    })) as typeof data;
    error = noCounter.error;
  } else if (error && isMissingColumn(error, "display_no")) {
    const legacy = await supabase
      .from("work_orders")
      .select(WORK_ORDER_SELECT_LEGACY)
      .eq("workspace_id", workspaceId)
      .in("status", [...OPEN_STATUSES])
      .order("opened_at", { ascending: false });
    data = (legacy.data ?? []).map((row) => ({
      ...row,
      display_no: null,
      counter_title: null,
    })) as typeof data;
    error = legacy.error;
  } else if (error && isMissingColumn(error, "remind_at")) {
    const noRemind = await supabase
      .from("work_orders")
      .select(WORK_ORDER_SELECT_NO_REMIND)
      .eq("workspace_id", workspaceId)
      .in("status", [...OPEN_STATUSES])
      .order("opened_at", { ascending: false });
    data = noRemind.data as typeof data;
    error = noRemind.error;
  } else if (error && isMissingColumn(error, "make_model")) {
    const noMake = await supabase
      .from("work_orders")
      .select(WORK_ORDER_SELECT_NO_MAKE)
      .eq("workspace_id", workspaceId)
      .in("status", [...OPEN_STATUSES])
      .order("opened_at", { ascending: false });
    data = noMake.data as typeof data;
    error = noMake.error;
  }

  if (error) throw error;

  const jobs = ((data ?? []) as unknown as WorkOrderQuery[])
    .map(toRow)
    .filter((row): row is WorkOrderRow => row !== null);

  const counts: Record<TodayBucket, number> = { inside: 0, parts: 0, ready: 0 };
  for (const job of jobs) {
    const bucket = bucketForStatus(job.status);
    if (bucket) counts[bucket] += 1;
  }

  return { counts, jobs };
}

export async function getJobsBoard(workspaceId: string): Promise<JobsBoard> {
  const board: JobsBoard = { inside: [], parts: [], ready: [] };
  const { jobs } = await getTodayBoard(workspaceId);
  for (const job of jobs) {
    const bucket = bucketForStatus(job.status);
    if (bucket) board[bucket].push(job);
  }
  return board;
}

export async function getStatusBoard(
  workspaceId: string,
  filters?: {
    assignee?: string | null;
    status?: string | null;
    unassigned?: boolean;
  },
): Promise<StatusBoard> {
  const emptyColumns = {
    intake: [] as BoardCard[],
    waiting_approval: [] as BoardCard[],
    in_progress: [] as BoardCard[],
    waiting_parts: [] as BoardCard[],
    ready: [] as BoardCard[],
  };
  const [today, assignments, money, renderedAtMs] = await Promise.all([
    getTodayBoard(workspaceId),
    listActiveAssignments(workspaceId),
    listMoneyOpen(workspaceId),
    requestNowMs(),
  ]);
  const { jobs } = today;
  const schemaMissing = assignments.schemaMissing || money.schemaMissing;
  const assignByWo = new Map(
    assignments.rows.map((row) => [row.workOrderId, row]),
  );

  const assigneeFilter = filters?.assignee?.trim() || null;
  const unassignedOnly = Boolean(filters?.unassigned);
  const statusFilter =
    filters?.status && isWorkOrderStatus(filters.status)
      ? boardColumnForStatus(filters.status)
      : null;

  for (const job of jobs) {
    const column = boardColumnForStatus(job.status);
    if (!column) continue;
    if (statusFilter && column !== statusFilter) continue;
    const assign = assignByWo.get(job.id) ?? null;
    if (unassignedOnly && assign) continue;
    if (assigneeFilter && assign?.membershipId !== assigneeFilter) continue;
    const totals = money.byId.get(job.id) ?? { due: 0, paid: 0, remaining: 0 };
    emptyColumns[column].push({
      ...job,
      assigneeMembershipId: assign?.membershipId ?? null,
      assigneeName: assign?.displayName ?? null,
      due: totals.due,
      paid: totals.paid,
      remaining: totals.remaining,
      waitText: waitLabel(job.openedAt, renderedAtMs),
    });
  }

  return { columns: emptyColumns, schemaMissing };
}

export async function searchWorkOrders(
  workspaceId: string,
  rawQuery: string,
): Promise<WorkOrderRow[]> {
  const parsed = parseJobQuery(rawQuery);
  if (parsed.kind === "empty") return [];

  const supabase = await createServerSupabase();
  if (!supabase) return [];

  let query = supabase
    .from("work_orders")
    .select(WORK_ORDER_SELECT)
    .eq("workspace_id", workspaceId)
    .order("opened_at", { ascending: false })
    .limit(20);

  if (parsed.kind === "display_no") {
    query = query.ilike("display_no", parsed.normalized);
  } else if (parsed.kind === "text") {
    query = query.or(
      `counter_title.ilike.%${parsed.raw}%,complaint.ilike.%${parsed.raw}%`,
    );
    query = query.limit(80);
  } else {
    // Plate match via vehicle embed is awkward in PostgREST; fetch recent and filter.
    query = query.limit(80);
  }

  const { data, error } = await query;
  if (error && isMissingColumn(error, "display_no") && parsed.kind === "display_no") {
    return [];
  }
  if (error && parsed.kind === "text" && isMissingColumn(error, "counter_title")) {
    return [];
  }
  if (error) throw error;

  const rows = ((data ?? []) as unknown as WorkOrderQuery[])
    .map(toRow)
    .filter((row): row is WorkOrderRow => row !== null);

  if (parsed.kind === "display_no") return rows.slice(0, 20);

  return rows.filter((row) => matchesJobQuery(parsed, row)).slice(0, 20);
}

export async function getWorkOrder(
  workspaceId: string,
  id: string,
): Promise<WorkOrderRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  let { data, error } = await supabase
    .from("work_orders")
    .select(WORK_ORDER_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();

  if (error && isMissingColumn(error, "display_no")) {
    const legacy = await supabase
      .from("work_orders")
      .select(WORK_ORDER_SELECT_LEGACY)
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .maybeSingle();
    data = legacy.data
      ? ({ ...legacy.data, display_no: null } as typeof data)
      : null;
    error = legacy.error;
  } else if (error && isMissingColumn(error, "remind_at")) {
    const noRemind = await supabase
      .from("work_orders")
      .select(WORK_ORDER_SELECT_NO_REMIND)
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .maybeSingle();
    data = noRemind.data as typeof data;
    error = noRemind.error;
  } else if (error && isMissingColumn(error, "make_model")) {
    const noMake = await supabase
      .from("work_orders")
      .select(WORK_ORDER_SELECT_NO_MAKE)
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .maybeSingle();
    data = noMake.data as typeof data;
    error = noMake.error;
  }

  if (error) throw error;
  if (!data) return null;
  return toRow(data as unknown as WorkOrderQuery);
}

export async function listDueMaintenanceReminders(
  workspaceId: string,
  endIso: string,
): Promise<{ rows: MaintenanceReminderRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("work_orders")
    .select(
      `
      id,
      display_no,
      remind_at,
      vehicle:vehicles(plate_normalized),
      customer:customers(phone)
    `,
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "delivered")
    .not("remind_at", "is", null)
    .lte("remind_at", endIso)
    .order("remind_at", { ascending: true })
    .limit(30);

  if (error) {
    if (isMissingColumn(error, "remind_at")) {
      return { rows: [], schemaMissing: true };
    }
    throw error;
  }

  const rows: MaintenanceReminderRow[] = [];
  for (const raw of data ?? []) {
    const row = raw as {
      id: string;
      display_no: string | null;
      remind_at: string | null;
      vehicle: Nested<{ plate_normalized: string }>;
      customer: Nested<{ phone: string | null }>;
    };
    if (!row.remind_at) continue;
    const vehicle = one(row.vehicle);
    if (!vehicle) continue;
    const customer = one(row.customer);
    rows.push({
      id: row.id,
      plate: displayPlate(vehicle.plate_normalized),
      displayNo: row.display_no,
      customerPhone: customer?.phone ?? null,
      remindAt: row.remind_at,
    });
  }

  return { rows, schemaMissing: false };
}

export async function getWorkOrderDetail(
  workspaceId: string,
  id: string,
): Promise<WorkOrderDetail | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  // Fan-out starts with the header row — do not wait for getWorkOrder first.
  const [job, itemsRes, paymentsRes, partsRes, mediaRes, extraRes] =
    await Promise.all([
      getWorkOrder(workspaceId, id),
      supabase
        .from("work_order_items")
        .select("id, kind, description, amount")
        .eq("work_order_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("payments")
        .select(
          "id, amount, method, invoice_mode, paid_at, note, work_order_id, voided_at",
        )
        .eq("work_order_id", id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("part_requests")
        .select("id, description, status")
        .eq("work_order_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("media")
        .select("id, storage_path, content_type, byte_size, created_at, tag")
        .eq("work_order_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("work_orders")
        .select(
          "quote_amount, entry_km, next_service_km, public_token, approved_at, customer_approval_note, approval_question_at, vehicle_checkup",
        )
        .eq("id", id)
        .maybeSingle(),
    ]);
  if (!job) return null;

  const paymentTableMissing =
    paymentsRes.error &&
    isMissingOpsRelation(paymentsRes.error) &&
    !isMissingColumn(paymentsRes.error, "voided_at")
      ? paymentsRes.error
      : null;
  const opsErrors = [itemsRes.error, paymentTableMissing, partsRes.error].filter(
    Boolean,
  );
  if (opsErrors.some(isMissingOpsRelation)) {
    return {
      ...job,
      items: [],
      payments: [],
      parts: [],
      media: [],
      due: 0,
      paid: 0,
      quoteAmount: null,
      entryKm: null,
      nextServiceKm: null,
      publicToken: null,
      approvedAt: null,
      customerApprovalNote: null,
      approvalQuestionAt: null,
      vehicleCheckup: {},
      opsSchemaMissing: true,
      faz4SchemaMissing: true,
    };
  }
  if (itemsRes.error) throw itemsRes.error;
  if (partsRes.error) throw partsRes.error;

  type MediaDbRow = {
    id: string;
    storage_path: string;
    content_type: string;
    byte_size: number;
    created_at: string;
    tag?: string | null;
  };
  let mediaRows: MediaDbRow[] = (mediaRes.data ?? []) as MediaDbRow[];
  let mediaError = mediaRes.error;
  if (mediaRes.error && isMissingColumn(mediaRes.error, "tag")) {
    const legacyMedia = await supabase
      .from("media")
      .select("id, storage_path, content_type, byte_size, created_at")
      .eq("work_order_id", id)
      .order("created_at", { ascending: false });
    mediaRows = (legacyMedia.data ?? []) as MediaDbRow[];
    mediaError = legacyMedia.error;
  }

  const faz4SchemaMissing = isMissingOpsRelation(mediaError);
  if (mediaError && !faz4SchemaMissing) throw mediaError;

  const items: WorkOrderItemRow[] = (itemsRes.data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    description: row.description,
    amount: Number(row.amount),
  }));
  type PayRow = {
    id: string;
    amount: number | string;
    method: string;
    invoice_mode: string;
    paid_at: string;
    note: string;
    work_order_id: string;
    voided_at?: string | null;
  };
  let paymentRows: PayRow[] = (paymentsRes.data ?? []) as PayRow[];
  if (paymentsRes.error && isMissingColumn(paymentsRes.error, "voided_at")) {
    const legacyPay = await supabase
      .from("payments")
      .select("id, amount, method, invoice_mode, paid_at, note, work_order_id")
      .eq("work_order_id", id)
      .order("paid_at", { ascending: false });
    if (legacyPay.error) throw legacyPay.error;
    paymentRows = (legacyPay.data ?? []).map((row) => ({
      ...row,
      voided_at: null,
    }));
  } else if (paymentsRes.error) {
    throw paymentsRes.error;
  }

  const payments: PaymentRow[] = paymentRows.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    method: row.method,
    invoiceMode: row.invoice_mode,
    paidAt: row.paid_at,
    note: row.note,
    workOrderId: row.work_order_id,
    voidedAt: row.voided_at ?? null,
  }));
  const parts: PartRequestRow[] = (partsRes.data ?? []).map((row) => ({
    id: row.id,
    description: row.description,
    status: row.status,
  }));
  const media: MediaRow[] = faz4SchemaMissing
    ? []
    : mediaRows.map((tagged) => {
        const tag =
          tagged.tag === "entry_damage" ||
          tagged.tag === "old_part" ||
          tagged.tag === "new_part"
            ? tagged.tag
            : null;
        return {
          id: tagged.id,
          storagePath: tagged.storage_path,
          contentType: tagged.content_type,
          byteSize: tagged.byte_size,
          createdAt: tagged.created_at,
          tag,
        };
      });

  const due = items.reduce((sum, item) => sum + item.amount, 0);
  const paid = sumPaidAmount(payments);

  type Extra = {
    quote_amount?: number | string | null;
    entry_km?: number | null;
    next_service_km?: number | null;
    public_token?: string | null;
    approved_at?: string | null;
    customer_approval_note?: string | null;
    approval_question_at?: string | null;
    vehicle_checkup?: Record<string, string> | null;
  };

  let extra: Extra = {};
  if (extraRes.error && isMissingColumn(extraRes.error, "entry_km")) {
    const quoteOnly = await supabase
      .from("work_orders")
      .select("quote_amount")
      .eq("id", id)
      .maybeSingle();
    if (!quoteOnly.error && quoteOnly.data) {
      extra = quoteOnly.data as Extra;
    }
  } else if (extraRes.error) {
    throw extraRes.error;
  } else {
    extra = (extraRes.data ?? {}) as Extra;
  }

  let quoteAmount: number | null =
    extra.quote_amount == null ? null : Number(extra.quote_amount);
  if (!Number.isFinite(quoteAmount)) quoteAmount = null;

  const entryKm =
    extra.entry_km == null || !Number.isFinite(Number(extra.entry_km))
      ? null
      : Number(extra.entry_km);
  const nextServiceKm =
    extra.next_service_km == null ||
    !Number.isFinite(Number(extra.next_service_km))
      ? null
      : Number(extra.next_service_km);

  const vehicleCheckup: VehicleCheckup = {};
  const rawCheck = extra.vehicle_checkup ?? {};
  for (const [key, value] of Object.entries(rawCheck)) {
    if (
      (key === "brake_pads" ||
        key === "tires" ||
        key === "battery" ||
        key === "wipers" ||
        key === "fluids" ||
        key === "belts") &&
      (value === "ok" || value === "soon" || value === "urgent")
    ) {
      vehicleCheckup[key] = value;
    }
  }

  return {
    ...job,
    items,
    payments,
    parts,
    media,
    due,
    paid,
    quoteAmount,
    entryKm,
    nextServiceKm,
    publicToken: extra.public_token ?? null,
    approvedAt: extra.approved_at ?? null,
    customerApprovalNote: extra.customer_approval_note ?? null,
    approvalQuestionAt: extra.approval_question_at ?? null,
    vehicleCheckup,
    faz4SchemaMissing: faz4SchemaMissing || undefined,
  };
}

function isMissingOpsRelation(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table")
  );
}

export async function listRecentPayments(workspaceId: string): Promise<PaymentRow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const mapRows = (
    rows: {
      id: string;
      amount: number | string;
      method: string;
      invoice_mode: string;
      paid_at: string;
      note: string;
      work_order_id: string;
      voided_at?: string | null;
      work_orders?: unknown;
    }[],
  ): PaymentRow[] =>
    rows.map((row) => {
      const woRaw = row.work_orders as unknown;
      const wo = Array.isArray(woRaw) ? woRaw[0] : woRaw;
      const vehiclesRaw =
        wo && typeof wo === "object" && "vehicles" in wo
          ? (wo as { vehicles: unknown }).vehicles
          : null;
      const vehicle = Array.isArray(vehiclesRaw)
        ? (vehiclesRaw[0] as { plate_normalized: string } | undefined)
        : (vehiclesRaw as { plate_normalized: string } | null);
      const displayNo =
        wo && typeof wo === "object" && "display_no" in wo
          ? ((wo as { display_no: string | null }).display_no ?? null)
          : null;
      const counterTitle =
        wo && typeof wo === "object" && "counter_title" in wo
          ? ((wo as { counter_title: string | null }).counter_title ?? null)
          : null;
      return {
        id: row.id,
        amount: Number(row.amount),
        method: row.method,
        invoiceMode: row.invoice_mode,
        paidAt: row.paid_at,
        note: row.note,
        workOrderId: row.work_order_id,
        plate: vehicle ? displayPlate(vehicle.plate_normalized) : undefined,
        counterTitle,
        displayNo,
        voidedAt: row.voided_at ?? null,
      };
    });

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, method, invoice_mode, paid_at, note, work_order_id, voided_at, work_orders(display_no, counter_title, vehicles(plate_normalized))",
    )
    .eq("workspace_id", workspaceId)
    .order("paid_at", { ascending: false })
    .limit(40);

  if (error && isMissingColumn(error, "voided_at")) {
    const legacy = await supabase
      .from("payments")
      .select(
        "id, amount, method, invoice_mode, paid_at, note, work_order_id, work_orders(display_no, vehicles(plate_normalized))",
      )
      .eq("workspace_id", workspaceId)
      .order("paid_at", { ascending: false })
      .limit(40);
    if (legacy.error) {
      if (isMissingOpsRelation(legacy.error)) return [];
      throw legacy.error;
    }
    return mapRows(
      (legacy.data ?? []).map((row) => ({ ...row, voided_at: null })),
    );
  }

  if (error) {
    if (isMissingOpsRelation(error)) return [];
    throw error;
  }

  return mapRows(data ?? []);
}

export async function listVehicles(workspaceId: string): Promise<VehicleRow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  type VehicleOrderEmbed = WorkOrderEmbed & { display_no?: string | null };

  const { data, error } = await supabase
    .from("vehicles")
    .select(
      `
      id,
      plate_normalized,
      work_orders(id, status, opened_at, display_no)
    `,
    )
    .eq("workspace_id", workspaceId)
    .order("plate_normalized", { ascending: true });

  if (error && isMissingColumn(error, "display_no")) {
    const legacy = await supabase
      .from("vehicles")
      .select(
        `
        id,
        plate_normalized,
        work_orders(id, status, opened_at)
      `,
      )
      .eq("workspace_id", workspaceId)
      .order("plate_normalized", { ascending: true });
    if (legacy.error) throw legacy.error;
    return mapVehicles(
      (legacy.data ?? []) as unknown as {
        id: string;
        plate_normalized: string;
        work_orders: Nested<VehicleOrderEmbed>;
      }[],
    );
  }

  if (error) throw error;

  return mapVehicles(
    (data ?? []) as unknown as {
      id: string;
      plate_normalized: string;
      work_orders: Nested<VehicleOrderEmbed>;
    }[],
  );
}

function mapVehicles(
  rows: {
    id: string;
    plate_normalized: string;
    work_orders: Nested<WorkOrderEmbed & { display_no?: string | null }>;
  }[],
): VehicleRow[] {
  return rows.map((vehicle) => {
    const orders = (
      Array.isArray(vehicle.work_orders)
        ? vehicle.work_orders
        : vehicle.work_orders
          ? [vehicle.work_orders]
          : []
    )
      .slice()
      .sort((a, b) => (a.opened_at < b.opened_at ? 1 : -1));

    const last = orders[0] ?? null;
    const open = orders.find((order) => {
      const status = asStatus(order.status);
      return status !== null && isOpenStatus(status);
    });
    const lastStatus = last ? asStatus(last.status) : null;

    return {
      id: vehicle.id,
      plate: displayPlate(vehicle.plate_normalized),
      lastJobId: last?.id ?? null,
      lastStatus,
      openJobId: open?.id ?? null,
      openDisplayNo: open?.display_no ?? null,
    };
  });
}

export type VehicleTimelineJob = {
  id: string;
  status: WorkOrderStatus;
  displayNo: string | null;
  openedAt: string;
  closedAt: string | null;
  due: number;
  remaining: number;
};

export type VehicleDetail = {
  id: string;
  plate: string;
  jobs: VehicleTimelineJob[];
};

export async function getVehicleDetail(
  workspaceId: string,
  vehicleId: string,
): Promise<VehicleDetail | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("id, plate_normalized")
    .eq("workspace_id", workspaceId)
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) throw error;
  if (!vehicle) return null;

  const { data: orders, error: ordersError } = await supabase
    .from("work_orders")
    .select("id, status, opened_at, closed_at, display_no")
    .eq("workspace_id", workspaceId)
    .eq("vehicle_id", vehicleId)
    .order("opened_at", { ascending: false })
    .limit(50);

  if (ordersError && isMissingColumn(ordersError, "display_no")) {
    const legacy = await supabase
      .from("work_orders")
      .select("id, status, opened_at, closed_at")
      .eq("workspace_id", workspaceId)
      .eq("vehicle_id", vehicleId)
      .order("opened_at", { ascending: false })
      .limit(50);
    if (legacy.error) throw legacy.error;
    const jobs = await attachMoneyToTimeline(
      workspaceId,
      (legacy.data ?? []).map((row) => ({ ...row, display_no: null })),
    );
    return {
      id: vehicle.id,
      plate: displayPlate(vehicle.plate_normalized),
      jobs,
    };
  }
  if (ordersError) throw ordersError;

  const jobs = await attachMoneyToTimeline(workspaceId, orders ?? []);
  return {
    id: vehicle.id,
    plate: displayPlate(vehicle.plate_normalized),
    jobs,
  };
}

async function attachMoneyToTimeline(
  workspaceId: string,
  orders: {
    id: string;
    status: string;
    opened_at: string;
    closed_at: string | null;
    display_no: string | null;
  }[],
): Promise<VehicleTimelineJob[]> {
  const money = await listMoneyOpen(workspaceId);
  const missingIds = orders
    .map((row) => row.id)
    .filter((id) => !money.byId.has(id));

  const closedTotals = new Map<
    string,
    { due: number; paid: number; remaining: number }
  >();
  if (missingIds.length > 0) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const [itemsRes, payRes] = await Promise.all([
        supabase
          .from("work_order_items")
          .select("work_order_id, amount")
          .in("work_order_id", missingIds),
        supabase
          .from("payments")
          .select("work_order_id, amount, method, voided_at")
          .in("work_order_id", missingIds),
      ]);
      const dueMap = new Map<string, number>();
      for (const row of itemsRes.data ?? []) {
        dueMap.set(
          row.work_order_id,
          (dueMap.get(row.work_order_id) ?? 0) + Number(row.amount),
        );
      }
      const paidMap = new Map<string, number>();
      for (const row of payRes.data ?? []) {
        if (row.method === "credit" || row.voided_at) continue;
        paidMap.set(
          row.work_order_id,
          (paidMap.get(row.work_order_id) ?? 0) + Number(row.amount),
        );
      }
      for (const id of missingIds) {
        const due = Math.round((dueMap.get(id) ?? 0) * 100) / 100;
        const paid = Math.round((paidMap.get(id) ?? 0) * 100) / 100;
        closedTotals.set(id, {
          due,
          paid,
          remaining: Math.max(0, Math.round((due - paid) * 100) / 100),
        });
      }
    }
  }

  return orders
    .map((row) => {
      const status = asStatus(row.status);
      if (!status) return null;
      const totals =
        money.byId.get(row.id) ??
        closedTotals.get(row.id) ?? { due: 0, paid: 0, remaining: 0 };
      return {
        id: row.id,
        status,
        displayNo: row.display_no,
        openedAt: row.opened_at,
        closedAt: row.closed_at,
        due: totals.due,
        remaining: totals.remaining,
      };
    })
    .filter((row): row is VehicleTimelineJob => row !== null);
}
