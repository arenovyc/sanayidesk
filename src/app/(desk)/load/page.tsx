import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listMechanicLoad } from "@/lib/data/assignments";

export default function LoadPage() {
  return (
    <Suspense fallback={null}>
      <LoadBody />
    </Suspense>
  );
}

async function LoadBody() {
  const ctx = await requireDeskSession();
  const { rows, schemaMissing } = await listMechanicLoad(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/more" className="hover:underline">
            Daha fazla
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold">Yük dağılımı</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Usta başına açık iş sayısı (prim yok).
        </p>
      </div>

      {schemaMissing ? (
        <SchemaHintBanner missing />
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Aktif usta yok.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {rows.map((row) => (
            <li key={row.membershipId}>
              <Link
                href={`/board?assignee=${row.membershipId}`}
                className="flex items-center justify-between px-4 py-3.5 text-sm"
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
