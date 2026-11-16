import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listBonusesThisMonth } from "@/lib/data/bonuses";
import { totalBonusAmount } from "@/lib/bonuses/rules";
import { formatMoney } from "@/lib/format/money";

export default function BonusesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <BonusesBody />
    </Suspense>
  );
}

async function BonusesBody() {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") redirect("/more");
  const { rows, schemaMissing } = await listBonusesThisMonth(ctx.workspace.id);

  const byMechanic = new Map<string, { name: string; total: number }>();
  for (const row of rows) {
    const prev = byMechanic.get(row.membershipId);
    if (prev) {
      prev.total = Math.round((prev.total + row.amount) * 100) / 100;
    } else {
      byMechanic.set(row.membershipId, {
        name: row.mechanicName,
        total: row.amount,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/more" className="hover:underline">
            Daha fazla
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold">Usta primleri</h1>
        <p className="mt-1 text-sm text-neutral-500">Bu ay (İstanbul saati).</p>
      </div>

      {schemaMissing ? (
        <SchemaHintBanner missing />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-500">Usta toplam</h2>
            {byMechanic.size === 0 ? (
              <p className="text-sm text-neutral-400">Bu ay prim yok.</p>
            ) : (
              <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {[...byMechanic.entries()].map(([id, row]) => (
                  <li
                    key={id}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span>{formatMoney(row.total)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-neutral-500">
              Toplam {formatMoney(totalBonusAmount(rows))}
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-500">Satırlar</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-neutral-400">Kayıt yok. İş detayından ekle.</p>
            ) : (
              <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/jobs/${row.workOrderId}`}
                      className="flex justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <span>
                        <span className="font-medium">{row.mechanicName}</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {row.displayNo ?? row.plate ?? "İş"}
                          {row.note ? ` · ${row.note}` : ""}
                        </span>
                      </span>
                      <span className="font-medium">{formatMoney(row.amount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
