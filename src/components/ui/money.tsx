import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";

export function Money({
  amount,
  tone = "default",
  className,
}: {
  amount: string | number;
  tone?: "default" | "debt" | "paid" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        tone === "default" && "text-neutral-950",
        tone === "debt" && "font-semibold text-red-700",
        tone === "paid" && "font-medium text-emerald-700",
        tone === "muted" && "text-neutral-500",
        className,
      )}
    >
      {formatMoney(amount)}
    </span>
  );
}
