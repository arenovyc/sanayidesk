import { Suspense } from "react";
import Link from "next/link";
import { PartStatusButtons } from "@/components/lift/part-status-buttons";
import { requireLiftSession } from "@/lib/auth/get-membership";
import { listOpenParts } from "@/lib/data/staff-work";

export default function PartsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <PartsBody />
    </Suspense>
  );
}

async function PartsBody() {
  await requireLiftSession();
  const parts = await listOpenParts();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Parça</h1>
      {parts.length === 0 ? (
        <p className="text-sm text-neutral-500">Açık parça isteği yok.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {parts.map((part) => (
            <li
              key={part.id}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Link href={`/lift/${part.workOrderId}`} className="min-w-0">
                  <span className="font-mono tracking-wide">{part.plate}</span>
                  {part.displayNo ? (
                    <span className="ml-2 font-mono text-xs text-neutral-500">
                      {part.displayNo}
                    </span>
                  ) : null}
                </Link>
                <span className="text-xs text-neutral-500">{part.status}</span>
              </div>
              <p className="mt-1 text-sm">{part.description}</p>
              <div className="mt-3">
                <PartStatusButtons id={part.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
