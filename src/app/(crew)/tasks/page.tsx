import { Suspense } from "react";
import { PartStatusButtons } from "@/components/lift/part-status-buttons";
import { requireCrewSession } from "@/lib/auth/get-membership";
import { listOpenParts } from "@/lib/data/staff-work";

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <TasksBody />
    </Suspense>
  );
}

async function TasksBody() {
  await requireCrewSession();
  const parts = await listOpenParts();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Görevler</h1>
      {parts.length === 0 ? (
        <p className="text-sm text-neutral-500">Alınacak parça yok.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {parts.map((part) => (
            <li
              key={part.id}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
            >
              <p className="font-mono tracking-wide">{part.plate}</p>
              <p className="mt-1 text-sm">{part.description}</p>
              <div className="mt-3">
                <PartStatusButtons id={part.id} showOrdered={false} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
