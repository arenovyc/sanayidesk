import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { PageHeader } from "@/components/shells/page-header";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listMechanicLoad } from "@/lib/data/assignments";

export default function LoadPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoadBody />
    </Suspense>
  );
}

async function LoadBody() {
  const ctx = await requireDeskSession();
  const { rows, schemaMissing } = await listMechanicLoad(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Yük dağılımı"
        backHref="/more"
        backLabel="Daha fazla"
        description="Usta başına açık iş sayısı (prim yok)."
      />

      {schemaMissing ? (
        <SchemaHintBanner missing />
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Aktif usta yok.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.membershipId}>
              <Link
                href={`/board?assignee=${row.membershipId}`}
                className={cn(
                  surfaceCard,
                  "flex min-h-14 items-center justify-between px-4 py-3.5 text-sm",
                )}
              >
                <span className="font-medium">{row.displayName}</span>
                <span className="tabular-nums text-neutral-600">
                  {row.openCount} açık
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
