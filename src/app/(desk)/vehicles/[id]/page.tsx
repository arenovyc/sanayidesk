import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SharedPlatePanel } from "@/components/desk/shared-plate-panel";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { formatMoney } from "@/lib/format/money";
import { getVehicleDetail } from "@/lib/data/work-orders";
import { STATUS_LABELS } from "@/lib/work-orders/status";

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <VehicleBody params={params} />
    </Suspense>
  );
}

async function VehicleBody({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireDeskSession();
  const { id } = await params;
  const vehicle = await getVehicleDetail(ctx.workspace.id, id);
  if (!vehicle) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/vehicles" className="hover:underline">
            Araçlar
          </Link>
        </p>
        <h1 className="mt-1 font-mono text-2xl tracking-wide">{vehicle.plate}</h1>
        <p className="mt-1 text-sm text-neutral-500">İş geçmişi (bu dükkan)</p>
      </div>

      {vehicle.jobs.length === 0 ? (
        <p className="text-sm text-neutral-500">İş emri yok.</p>
      ) : (
        <ol className="relative space-y-0 border-l border-neutral-200 pl-4">
          {vehicle.jobs.map((job) => (
            <li key={job.id} className="relative pb-4">
              <span className="absolute -left-[1.3rem] top-1.5 size-2.5 rounded-full bg-neutral-400" />
              <Link href={`/jobs/${job.id}`} className="block rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{STATUS_LABELS[job.status]}</span>
                  <span className="font-mono text-xs text-neutral-500">
                    {job.displayNo ?? "—"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {new Date(job.openedAt).toLocaleString("tr-TR", {
                    timeZone: "Europe/Istanbul",
                  })}
                </p>
                {(job.due > 0 || job.remaining > 0) && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Toplam {formatMoney(job.due)} · Kalan{" "}
                    {formatMoney(job.remaining)}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}

      <SharedPlatePanel defaultPlate={vehicle.plate} />
    </div>
  );
}
