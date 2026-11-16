import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listAudit, type AuditActionFilter } from "@/lib/data/ops";

const FILTERS: { id: AuditActionFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "payment", label: "Ödeme" },
  { id: "b2b", label: "B2B" },
  { id: "work_order", label: "İş" },
  { id: "assignment", label: "Atama" },
];

function parseFilter(raw: string | undefined): AuditActionFilter {
  if (
    raw === "payment" ||
    raw === "b2b" ||
    raw === "work_order" ||
    raw === "assignment"
  ) {
    return raw;
  }
  return "all";
}

export default function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <AuditBody searchParams={searchParams} />
    </Suspense>
  );
}

async function AuditBody({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const ctx = await requireDeskSession();
  // Desk (owner + advisor) may read after 007 RLS; staff still redirected by layout.
  if (ctx.membership.role !== "owner" && ctx.membership.role !== "advisor") {
    redirect("/more");
  }
  const query = await searchParams;
  const filter = parseFilter(query.action);
  const rows = await listAudit(ctx.workspace.id, filter);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">İşlem geçmişi</h1>
      <ul className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <li key={item.id}>
            <Link
              href={item.id === "all" ? "/audit" : `/audit?action=${item.id}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filter === item.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Kayıt yok.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{row.action}</p>
              <p className="text-neutral-500">
                {row.entityType}
                {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(row.createdAt).toLocaleString("tr-TR", {
                  timeZone: "Europe/Istanbul",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
