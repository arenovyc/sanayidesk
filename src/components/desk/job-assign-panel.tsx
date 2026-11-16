import { AssignForm } from "@/components/desk/assign-form";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import type { AssignmentHistoryRow } from "@/lib/data/assignments";
import type { TeamMember } from "@/lib/data/ops";

export function JobAssignPanel({
  workOrderId,
  mechanics,
  currentMembershipId,
  history,
  schemaMissing,
}: {
  workOrderId: string;
  mechanics: TeamMember[];
  currentMembershipId: string | null;
  history: AssignmentHistoryRow[];
  schemaMissing: boolean;
}) {
  if (schemaMissing) {
    return <SchemaHintBanner missing />;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-neutral-500">Usta ataması</h2>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <AssignForm
          workOrderId={workOrderId}
          mechanics={mechanics}
          currentMembershipId={currentMembershipId}
          returnTo={`/jobs/${workOrderId}`}
        />
      </div>
      {history.length > 0 ? (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {history.map((row) => (
            <li key={row.id} className="px-4 py-2.5 text-sm">
              <p className="font-medium">{row.displayName}</p>
              <p className="text-xs text-neutral-500">
                {new Date(row.assignedAt).toLocaleString("tr-TR")}
                {row.unassignedAt
                  ? ` → ${new Date(row.unassignedAt).toLocaleString("tr-TR")}`
                  : " · aktif"}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
