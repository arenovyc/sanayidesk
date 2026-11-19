import { Suspense } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { PageSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireLiftSession } from "@/lib/auth/get-membership";
import { listOpenJobsForWorkspace } from "@/lib/data/staff-work";
import { surfaceCardInteractive } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

export default function LiftPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LiftBody />
    </Suspense>
  );
}

async function LiftBody() {
  await requireLiftSession();
  const jobs = await listOpenJobsForWorkspace();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Liftim</h1>
      {jobs.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Şu an açık iş yok"
          description="Patron atayınca işlerin burada görünür."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/lift/${job.id}`}
                className={cn(
                  surfaceCardInteractive,
                  "flex min-h-14 items-center justify-between gap-3 px-4 py-3",
                )}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <LicensePlateBadge plate={job.plate} size="sm" />
                  {job.displayNo ? (
                    <span className="font-mono text-xs tabular-nums text-neutral-400">
                      {job.displayNo}
                    </span>
                  ) : null}
                  {job.makeModel ? (
                    <span className="truncate text-xs text-neutral-500">
                      {job.makeModel}
                    </span>
                  ) : null}
                </span>
                <StatusBadge status={job.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
