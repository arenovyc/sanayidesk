import { Suspense } from "react";
import { PartStatusButtons } from "@/components/lift/part-status-buttons";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { PageSkeleton } from "@/components/ui/skeleton";
import { requireCrewSession } from "@/lib/auth/get-membership";
import { listOpenParts } from "@/lib/data/staff-work";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
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
              className={cn(surfaceCard, "px-4 py-3")}
            >
              <LicensePlateBadge plate={part.plate} size="sm" />
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
