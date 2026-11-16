import { JobB2bPanel } from "@/components/desk/b2b-forms";
import { JobBonusPanel } from "@/components/desk/job-bonus-form";
import { JobPartsSection } from "@/components/desk/job-money-forms";
import {
  listB2bEntriesForWorkOrder,
  listExternalParties,
} from "@/lib/data/b2b";
import { listBonusesForWorkOrder } from "@/lib/data/bonuses";
import { listDirectory, listTeam } from "@/lib/data/ops";
import type { PartRequestRow } from "@/lib/work-orders/types";

/** Loaded only when the “Dış iş” tab mounts. */
export async function JobDisTab({
  workspaceId,
  workOrderId,
  shopName,
  plate,
  displayNo,
  parts,
  isOwner,
}: {
  workspaceId: string;
  workOrderId: string;
  shopName: string;
  plate: string;
  displayNo?: string | null;
  parts: PartRequestRow[];
  isOwner: boolean;
}) {
  const [partiesRes, jobB2bRes, directory, team, bonusesRes] = await Promise.all([
    listExternalParties(workspaceId),
    listB2bEntriesForWorkOrder(workspaceId, workOrderId),
    listDirectory(workspaceId),
    listTeam(workspaceId),
    listBonusesForWorkOrder(workspaceId, workOrderId),
  ]);

  const mechanics = team.filter(
    (member) => member.role === "mechanic" && member.isActive,
  );

  return (
    <>
      <JobPartsSection
        workOrderId={workOrderId}
        parts={parts}
        plate={plate}
        displayNo={displayNo}
        shopName={shopName}
        directory={directory}
      />
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
