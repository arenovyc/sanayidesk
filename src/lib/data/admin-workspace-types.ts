export type AdminWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isSuspended: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  cityDistrict: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  workOrderCount: number;
  mechanicCount: number;
  lastActivityAt: string | null;
};

export function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / 86_400_000);
}
