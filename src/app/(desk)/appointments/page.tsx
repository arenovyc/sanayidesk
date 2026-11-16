import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { AppointmentPanel } from "@/components/desk/appointment-forms";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listAppointments } from "@/lib/data/appointments";

export default function AppointmentsPage() {
  return (
    <Suspense fallback={null}>
      <AppointmentsBody />
    </Suspense>
  );
}

async function AppointmentsBody() {
  const ctx = await requireDeskSession();
  const result = await listAppointments(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Randevular"
        backHref="/more"
        backLabel="Daha fazla"
        description="Sıra ve planlı geliş. İşe alınca plaka kabul açılır."
      />
      {result.schemaMissing ? (
        <SchemaHintBanner missing quietProd />
      ) : result.rows.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Randevu yok"
          description="Aşağıdan yeni sıra veya planlı randevu ekle."
        />
      ) : null}
      {!result.schemaMissing ? <AppointmentPanel rows={result.rows} /> : null}
    </div>
  );
}
