import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type ExternalPartyRow = {
  id: string;
  name: string;
  phone: string;
  note: string;
  linkedDirectoryId: string | null;
  linkedWorkspaceId: string | null;
};

export type B2bEntryRow = {
  id: string;
  amount: number;
  direction: "we_owe" | "they_owe";
  status: "pending" | "confirmed" | "rejected";
  note: string;
  createdAt: string;
  partyName: string;
  partyId: string;
  workOrderId: string | null;
};

export type PartyBalanceRow = {
  partyId: string;
  partyName: string;
  weOweTotal: number;
  theyOweTotal: number;
  net: number;
};

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("b2b_party_balances")
  );
}

function mapEntry(row: {
  id: string;
  amount: number | string;
  direction: string;
  status: string;
  note: string;
  created_at: string;
  external_party_id: string;
  work_order_id?: string | null;
  external_parties?: unknown;
}): B2bEntryRow {
  const partyRaw = row.external_parties as unknown;
  const party = Array.isArray(partyRaw) ? partyRaw[0] : partyRaw;
  const name =
    party && typeof party === "object" && "name" in party
      ? String((party as { name: string }).name)
      : "—";
  return {
    id: row.id,
    amount: Number(row.amount),
    direction: row.direction as B2bEntryRow["direction"],
    status: row.status as B2bEntryRow["status"],
    note: row.note,
    createdAt: row.created_at,
    partyName: name,
    partyId: row.external_party_id,
    workOrderId: row.work_order_id ?? null,
  };
}

export async function listExternalParties(
  workspaceId: string,
): Promise<{ rows: ExternalPartyRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const withLink = await supabase
    .from("external_parties")
    .select("id, name, phone, note, linked_directory_id, linked_workspace_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (withLink.error) {
    if (isMissingRelation(withLink.error)) {
      return { rows: [], schemaMissing: true };
    }
    const msg = (withLink.error.message ?? "").toLowerCase();
    if (msg.includes("linked_workspace_id")) {
      const legacy = await supabase
        .from("external_parties")
        .select("id, name, phone, note, linked_directory_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (legacy.error) {
        if (isMissingRelation(legacy.error)) {
          return { rows: [], schemaMissing: true };
        }
        throw legacy.error;
      }
      return {
        schemaMissing: false,
        rows: (legacy.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          note: row.note,
          linkedDirectoryId: row.linked_directory_id,
          linkedWorkspaceId: null,
        })),
      };
    }
    throw withLink.error;
  }

  return {
    schemaMissing: false,
    rows: (withLink.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      note: row.note,
      linkedDirectoryId: row.linked_directory_id,
      linkedWorkspaceId:
        "linked_workspace_id" in row
          ? ((row as { linked_workspace_id: string | null }).linked_workspace_id ??
            null)
          : null,
    })),
  };
}

export async function getExternalParty(
  workspaceId: string,
  partyId: string,
): Promise<{ row: ExternalPartyRow | null; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { row: null, schemaMissing: false };

  const withLink = await supabase
    .from("external_parties")
    .select("id, name, phone, note, linked_directory_id, linked_workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("id", partyId)
    .maybeSingle();

  if (withLink.error) {
    if (isMissingRelation(withLink.error)) {
      return { row: null, schemaMissing: true };
    }
    const msg = (withLink.error.message ?? "").toLowerCase();
    if (msg.includes("linked_workspace_id")) {
      const legacy = await supabase
        .from("external_parties")
        .select("id, name, phone, note, linked_directory_id")
        .eq("workspace_id", workspaceId)
        .eq("id", partyId)
        .maybeSingle();
      if (legacy.error) {
        if (isMissingRelation(legacy.error)) {
          return { row: null, schemaMissing: true };
        }
        throw legacy.error;
      }
      if (!legacy.data) return { row: null, schemaMissing: false };
      return {
        schemaMissing: false,
        row: {
          id: legacy.data.id,
          name: legacy.data.name,
          phone: legacy.data.phone,
          note: legacy.data.note,
          linkedDirectoryId: legacy.data.linked_directory_id,
          linkedWorkspaceId: null,
        },
      };
    }
    throw withLink.error;
  }
  if (!withLink.data) return { row: null, schemaMissing: false };

  return {
    schemaMissing: false,
    row: {
      id: withLink.data.id,
      name: withLink.data.name,
      phone: withLink.data.phone,
      note: withLink.data.note,
      linkedDirectoryId: withLink.data.linked_directory_id,
      linkedWorkspaceId:
        (withLink.data as { linked_workspace_id?: string | null })
          .linked_workspace_id ?? null,
    },
  };
}

export async function listB2bEntries(
  workspaceId: string,
): Promise<{ rows: B2bEntryRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("b2b_ledger_entries")
    .select(
      "id, amount, direction, status, note, created_at, external_party_id, work_order_id, external_parties(name)",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map(mapEntry),
  };
}

export async function listB2bEntriesForParty(
  workspaceId: string,
  partyId: string,
): Promise<{ rows: B2bEntryRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("b2b_ledger_entries")
    .select(
      "id, amount, direction, status, note, created_at, external_party_id, work_order_id, external_parties(name)",
    )
    .eq("workspace_id", workspaceId)
    .eq("external_party_id", partyId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map(mapEntry),
  };
}

export async function listB2bEntriesForWorkOrder(
  workspaceId: string,
  workOrderId: string,
): Promise<{ rows: B2bEntryRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("b2b_ledger_entries")
    .select(
      "id, amount, direction, status, note, created_at, external_party_id, work_order_id, external_parties(name)",
    )
    .eq("workspace_id", workspaceId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map(mapEntry),
  };
}

export async function listPartyBalances(
  workspaceId: string,
): Promise<{ rows: PartyBalanceRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("b2b_party_balances")
    .select("party_id, party_name, we_owe_total, they_owe_total, net")
    .eq("workspace_id", workspaceId)
    .order("party_name", { ascending: true });

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => ({
      partyId: row.party_id,
      partyName: row.party_name,
      weOweTotal: Number(row.we_owe_total),
      theyOweTotal: Number(row.they_owe_total),
      net: Number(row.net),
    })),
  };
}
