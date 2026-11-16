import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
      {Icon ? (
        <Icon className="mb-3 size-8 text-neutral-300" aria-hidden />
      ) : null}
      <p className="text-sm font-medium text-neutral-950">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-sm text-neutral-500">{description}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <Button asChild className="mt-4" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
