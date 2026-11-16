import { JobB2bPanel } from "@/components/desk/b2b-forms";
import { JobBonusPanel } from "@/components/desk/job-bonus-form";
import {
  listB2bEntriesForWorkOrder,
  listExternalParties,
} from "@/lib/data/b2b";
import { listBonusesForWorkOrder } from "@/lib/data/bonuses";
import { listTeam } from "@/lib/data/ops";

/** Loaded only when the “Dış iş” tab mounts. */
export async function JobDisTab({
  workspaceId,
  workOrderId,
  isOwner,
}: {
  workspaceId: string;
  workOrderId: string;
  isOwner: boolean;
}) {
  const [partiesRes, jobB2bRes, team, bonusesRes] = await Promise.all([
    listExternalParties(workspaceId),
    listB2bEntriesForWorkOrder(workspaceId, workOrderId),
    listTeam(workspaceId),
    listBonusesForWorkOrder(workspaceId, workOrderId),
  ]);

  const mechanics = team.filter(
    (member) => member.role === "mechanic" && member.isActive,
  );

  return (
    <>
      <JobBonusPanel
        workOrderId={workOrderId}
        mechanics={mechanics}
        bonuses={bonusesRes.rows}
        isOwner={isOwner}
        schemaMissing={bonusesRes.schemaMissing}
      />
      <JobB2bPanel
        workOrderId={workOrderId}
        parties={partiesRes.rows}
        entries={jobB2bRes.rows}
        isOwner={isOwner}
        schemaMissing={partiesRes.schemaMissing || jobB2bRes.schemaMissing}
      />
    </>
  );
}
