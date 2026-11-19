import { JobAssignPanel } from "@/components/desk/job-assign-panel";
import { JobMediaPanel } from "@/components/desk/job-media-form";
import { listAssignmentHistory } from "@/lib/data/assignments";
import { signedMediaUrls } from "@/lib/data/media-urls";
import type { TeamMember } from "@/lib/data/ops";
import type { MediaRow } from "@/lib/work-orders/types";

/** Signed URLs are N storage round-trips — stream after the job shell paints. */
export async function JobMediaSection({
  workOrderId,
  media,
  schemaMissing,
}: {
  workOrderId: string;
  media: MediaRow[];
  schemaMissing?: boolean;
}) {
  const signedUrls = schemaMissing ? {} : await signedMediaUrls(media);
  return (
    <JobMediaPanel
      workOrderId={workOrderId}
      media={media}
      signedUrls={signedUrls}
      schemaMissing={schemaMissing}
    />
  );
}

/** Assignment history is Özet-only — do not block the sticky header. */
export async function JobAssignSection({
  workspaceId,
  workOrderId,
  mechanics,
}: {
  workspaceId: string;
  workOrderId: string;
  mechanics: TeamMember[];
}) {
  const historyRes = await listAssignmentHistory(workspaceId, workOrderId);
  const active = historyRes.rows.find((row) => !row.unassignedAt) ?? null;
  return (
    <JobAssignPanel
      workOrderId={workOrderId}
      mechanics={mechanics}
      currentMembershipId={active?.membershipId ?? null}
      history={historyRes.rows}
      schemaMissing={historyRes.schemaMissing}
    />
  );
}
