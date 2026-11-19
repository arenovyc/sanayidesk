import { JobInventoryIssueForm } from "@/components/desk/inventory-forms";
import {
  JobItemsSection,
  JobPartsSection,
} from "@/components/desk/job-money-forms";
import { QuoteApprovalButton } from "@/components/desk/quote-approval-button";
import { listDirectory } from "@/lib/data/ops";
import { listInventoryItems } from "@/lib/data/inventory";
import { formatMoney } from "@/lib/format/money";
import type { WorkOrderDetail } from "@/lib/work-orders/types";

export async function JobDetailIsPanel({
  workspaceId,
  job,
  shopName,
  shopPhone,
  quotePreview,
}: {
  workspaceId: string;
  job: WorkOrderDetail;
  shopName: string;
  shopPhone: string | null | undefined;
  quotePreview: string;
}) {
  const [inventoryRes, directory] = await Promise.all([
    listInventoryItems(workspaceId),
    listDirectory(workspaceId),
  ]);

  const hasItems = job.items.length > 0;
  const itemsTotal = job.items.reduce((sum, item) => sum + item.amount, 0);
  const quoteLabel = formatMoney(hasItems ? itemsTotal : 0);

  return (
  <>
    <JobItemsSection workOrderId={job.id} items={job.items} />

    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-600">
        Fiyat onayı — durum &quot;Onay Bekliyor&quot; olur, WhatsApp + onay
        linki açılır. Tutar kalem toplamıdır.
      </p>
      {!hasItems ? (
        <p className="text-sm text-amber-800">
          Önce kalem ekle; aksi halde toplam ₺0 görünür.
        </p>
      ) : null}
      <QuoteApprovalButton
        workOrderId={job.id}
        preview={quotePreview}
        phone={job.customerPhone}
        shopName={shopName}
        plate={job.plate}
        quoteLabel={quoteLabel}
        shopPhone={shopPhone}
        disabled={
          !hasItems ||
          job.status === "delivered" ||
          job.status === "cancelled"
        }
      />
    </div>

    {!inventoryRes.schemaMissing ? (
      <JobInventoryIssueForm workOrderId={job.id} items={inventoryRes.rows} />
    ) : null}

    <JobPartsSection
      workOrderId={job.id}
      parts={job.parts}
      plate={job.plate}
      displayNo={job.displayNo}
      shopName={shopName}
      directory={directory}
    />
  </>
  );
}