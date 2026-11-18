import type {
  OpenWorkOrderStatus,
  TodayBucket,
  WorkOrderStatus,
} from "@/lib/work-orders/status";

export type WorkOrderRow = {
  id: string;
  status: WorkOrderStatus;
  complaint: string;
  openedAt: string;
  closedAt: string | null;
  plate: string;
  /** Plakasız tezgâh başlığı; plate boş olabilir */
  counterTitle: string | null;
  displayNo: string | null;
  makeModel: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  remindAt: string | null;
};

export type MaintenanceReminderRow = {
  id: string;
  plate: string;
  displayNo: string | null;
  customerPhone: string | null;
  remindAt: string;
};

export type BoardCard = WorkOrderRow & {
  assigneeMembershipId: string | null;
  assigneeName: string | null;
  due: number;
  paid: number;
  remaining: number;
  /** Frozen at board fetch so client hydrate matches SSR. */
  waitText: string;
};

export type StatusBoard = {
  columns: Record<OpenWorkOrderStatus, BoardCard[]>;
  schemaMissing: boolean;
};

export type WorkOrderItemRow = {
  id: string;
  kind: string;
  description: string;
  amount: number;
};

export type PaymentRow = {
  id: string;
  amount: number;
  method: string;
  invoiceMode: string;
  paidAt: string;
  note: string;
  workOrderId: string;
  plate?: string;
  displayNo?: string | null;
  voidedAt?: string | null;
};

export type PartRequestRow = {
  id: string;
  description: string;
  status: string;
};

export type MediaTag = "entry_damage" | "old_part" | "new_part";

export type MediaRow = {
  id: string;
  storagePath: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
  tag: MediaTag | null;
};

export type VehicleCheckupLevel = "ok" | "soon" | "urgent";

export type VehicleCheckup = Partial<
  Record<
    "brake_pads" | "tires" | "battery" | "wipers" | "fluids" | "belts",
    VehicleCheckupLevel
  >
>;

export type WorkOrderDetail = WorkOrderRow & {
  items: WorkOrderItemRow[];
  payments: PaymentRow[];
  parts: PartRequestRow[];
  media: MediaRow[];
  due: number;
  paid: number;
  quoteAmount: number | null;
  entryKm: number | null;
  nextServiceKm: number | null;
  publicToken: string | null;
  approvedAt: string | null;
  customerApprovalNote: string | null;
  approvalQuestionAt: string | null;
  vehicleCheckup: VehicleCheckup;
  /** Mega tablolar (003) yoksa true — kalem/tahsilat boş, crash yok */
  opsSchemaMissing?: boolean;
  /** 004 media yoksa true */
  faz4SchemaMissing?: boolean;
};

export type TodayBoard = {
  counts: Record<TodayBucket, number>;
  jobs: WorkOrderRow[];
};

export type JobsBoard = Record<TodayBucket, WorkOrderRow[]>;

export type VehicleRow = {
  id: string;
  plate: string;
  lastJobId: string | null;
  lastStatus: WorkOrderStatus | null;
  openJobId: string | null;
  openDisplayNo: string | null;
};
