import { Suspense } from "react";
import Link from "next/link";
import { requireLiftSession } from "@/lib/auth/get-membership";
import { listOpenJobsForWorkspace } from "@/lib/data/staff-work";
import { STATUS_LABELS } from "@/lib/work-orders/status";

export default function LiftPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <LiftBody />
    </Suspense>
  );
}

async function LiftBody() {
  await requireLiftSession();
  const jobs = await listOpenJobsForWorkspace();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Liftim</h1>
      {jobs.length === 0 ? (
        <p className="text-sm text-neutral-500">Şu an açık iş yok.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/lift/${job.id}`}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-4"
              >
                <span>
                  <span className="font-mono text-lg tracking-wide">{job.plate}</span>
                  {job.displayNo ? (
                    <span className="mt-0.5 block font-mono text-xs text-neutral-500">
                      {job.displayNo}
                    </span>
                  ) : null}
                  {job.makeModel ? (
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {job.makeModel}
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-neutral-500">{STATUS_LABELS[job.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
