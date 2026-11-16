import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { MembershipRole } from "@/lib/auth/roles";

export type TeamMember = {
  id: string;
  role: MembershipRole;
  displayName: string;
  isActive: boolean;
  hasPin: boolean;
};

export type DirectoryContact = {
  id: string;
  name: string;
  phone: string;
  note: string;
};

export type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

export async function listTeam(workspaceId: string): Promise<TeamMember[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("memberships")
    .select("id, role, display_name, is_active")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role as MembershipRole,
    displayName: row.display_name,
    isActive: row.is_active,
    hasPin: row.role === "mechanic" || row.role === "apprentice",
  }));
}

export async function listDirectory(workspaceId: string): Promise<DirectoryContact[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("directory_contacts")
    .select("id, name, phone, note")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    note: row.note,
  }));
}

export type AuditActionFilter =
  | "payment"
  | "b2b"
  | "work_order"
  | "assignment"
  | "all";

const AUDIT_PREFIX: Record<Exclude<AuditActionFilter, "all">, string[]> = {
  payment: ["payment"],
  b2b: ["b2b"],
  work_order: ["work_order", "status"],
  assignment: ["assignment", "bonus"],
};

export async function listAudit(
  workspaceId: string,
  filter: AuditActionFilter = "all",
): Promise<AuditRow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  }));

  if (filter === "all") return rows;
  const prefixes = AUDIT_PREFIX[filter];
  return rows.filter((row) =>
    prefixes.some(
      (prefix) =>
        row.action.startsWith(prefix) || row.entityType.startsWith(prefix),
    ),
  );
}
