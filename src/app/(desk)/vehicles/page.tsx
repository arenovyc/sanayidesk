import { Suspense } from "react";
import Link from "next/link";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listVehicles } from "@/lib/data/work-orders";
import { STATUS_LABELS } from "@/lib/work-orders/status";

export default function VehiclesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <VehiclesBody />
    </Suspense>
  );
}

async function VehiclesBody() {
  const ctx = await requireDeskSession();
  const vehicles = await listVehicles(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Araçlar</h1>
      {vehicles.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz araç yok. Plaka ile kabul et.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {vehicles.map((vehicle) => {
            const status = vehicle.lastStatus
              ? STATUS_LABELS[vehicle.lastStatus]
              : "İş yok";
            return (
              <li key={vehicle.id}>
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  className="flex items-center justify-between px-4 py-3.5"
                >
                  <span>
                    <span className="font-mono tracking-wide">{vehicle.plate}</span>
                    {vehicle.openDisplayNo ? (
                      <span className="ml-2 font-mono text-xs text-neutral-500">
                        {vehicle.openDisplayNo}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm text-neutral-500">{status}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
