import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { AcceptForm } from "@/components/desk/accept-form";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { normalizePlate } from "@/lib/format/plate";

export default function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ plate?: string; complaint?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <NewJobBody searchParams={searchParams} />
    </Suspense>
  );
}

async function NewJobBody({
  searchParams,
}: {
  searchParams: Promise<{ plate?: string; complaint?: string }>;
}) {
  await requireDeskSession();
  const params = await searchParams;
  const plate = params.plate ? normalizePlate(params.plate) : "";
  const complaint = params.complaint?.trim() ?? "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Araç kabul</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Plaka yeterli. Ad ve telefon sonra da eklenebilir.
        </p>
      </div>
      <AcceptForm
        defaultPlate={plate}
        defaultComplaint={complaint}
        extraFields
      />
    </div>
  );
}
