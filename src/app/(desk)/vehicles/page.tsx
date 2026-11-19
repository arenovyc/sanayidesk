import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Car } from "lucide-react";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listVehicles } from "@/lib/data/work-orders";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { isWorkOrderStatus } from "@/lib/work-orders/status";

export default function VehiclesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VehiclesBody />
    </Suspense>
  );
}

async function VehiclesBody() {
  const ctx = await requireDeskSession();
  const vehicles = await listVehicles(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Araçlar"
        backHref="/more"
        backLabel="Daha fazla"
        description="Bu dükkanda kaydı olan plakalar."
      />
      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Henüz araç yok"
          description="Plaka ile kabul et — araç burada görünür."
          actionHref="/today"
          actionLabel="Bugün"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {vehicles.map((vehicle) => {
            return (
              <li key={vehicle.id}>
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  className={cn(
                    surfaceCard,
                    "flex min-h-14 items-center justify-between gap-3 px-4 py-3",
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <LicensePlateBadge plate={vehicle.plate} size="sm" />
                    {vehicle.openDisplayNo ? (
                      <span className="font-mono text-xs tabular-nums text-neutral-500">
                        {vehicle.openDisplayNo}
                      </span>
                    ) : null}
                  </span>
                  {vehicle.lastStatus && isWorkOrderStatus(vehicle.lastStatus) ? (
                    <StatusBadge status={vehicle.lastStatus} />
                  ) : (
                    <span className="text-sm text-neutral-500">İş yok</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
