import { cn } from "@/lib/utils";
import { statusLabelFor } from "@/lib/trade/profile";
import type { WorkOrderStatus } from "@/lib/work-orders/status";
import { statusTone } from "@/lib/work-orders/status-tone";

export function StatusBadge({
  status,
  tradeKind,
  label,
  className,
}: {
  status: WorkOrderStatus;
  tradeKind?: string | null;
  label?: string;
  className?: string;
}) {
  const text = label ?? statusLabelFor(tradeKind, status);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusTone(status).badge,
        className,
      )}
    >
      {text}
    </span>
  );
}
