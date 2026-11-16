import type { MembershipRole } from "@/lib/auth/roles";

export type AppUser = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  phone: string | null;
};

export type WorkspaceSettings = {
  phone?: string;
  address?: string;
  shareVehicleHistory?: boolean;
  networkVisible?: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  type: "repair";
  plan: string;
  settings: WorkspaceSettings;
  isSuspended: boolean;
  trialEndsAt: string | null;
};

export type Membership = {
  id: string;
  user_id: string;
  workspace_id: string;
  role: MembershipRole;
  display_name: string;
  is_active: boolean;
};

export type SessionContext = {
  authEmail: string | null;
  appUser: AppUser;
  membership: Membership;
  workspace: Workspace;
};
