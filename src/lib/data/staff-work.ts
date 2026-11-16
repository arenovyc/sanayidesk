import "server-only";
import { getStaffContext } from "@/lib/auth/staff-session";
import { displayPlate } from "@/lib/format/plate";
import { createServerSupabase } from "@/lib/supabase/server";
import { isWorkOrderStatus, type WorkOrderStatus } from "@/lib/work-orders/status";

export type StaffJob = {
  id: string;
  plate: string;
  status: WorkOrderStatus;
  complaint: string;
  displayNo: string | null;
  assigneeName: string | null;
  makeModel: string | null;
};

export type StaffPart = {
  id: string;
  description: string;
  status: string;
  workOrderId: string;
  plate: string;
  displayNo: string | null;
};

export async function listOpenJobsForWorkspace(): Promise<StaffJob[]> {
  const staff = await getStaffContext();
  if (!staff) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("staff_list_open_jobs", {
    _token: staff.token,
  });
  if (error) throw error;

  return ((data as unknown[]) ?? [])
    .map((row) => {
      const item = row as {
        id?: string;
        status?: string;
        complaint?: string;
        plate?: string;
        display_no?: string | null;
        assignee_name?: string | null;
        make_model?: string | null;
      };
      const status = item.status && isWorkOrderStatus(item.status) ? item.status : null;
      if (!item.id || !status || !item.plate) return null;
      return {
        id: item.id,
        plate: displayPlate(item.plate),
        status,
        complaint: item.complaint ?? "",
        displayNo: item.display_no ?? null,
        assigneeName: item.assignee_name ?? null,
        makeModel: item.make_model?.trim() || null,
      };
    })
    .filter((row): row is StaffJob => row !== null);
}

export async function getStaffJob(id: string): Promise<StaffJob | null> {
  const jobs = await listOpenJobsForWorkspace();
  return jobs.find((job) => job.id === id) ?? null;
}

export async function listOpenParts(): Promise<StaffPart[]> {
  const staff = await getStaffContext();
  if (!staff) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("staff_list_open_parts", {
    _token: staff.token,
  });
  if (error) throw error;

  return ((data as unknown[]) ?? []).map((row) => {
    const item = row as {
      id: string;
      description: string;
      status: string;
      work_order_id: string;
      plate: string;
      display_no?: string | null;
    };
    return {
      id: item.id,
      description: item.description,
      status: item.status,
      workOrderId: item.work_order_id,
      plate: displayPlate(item.plate),
      displayNo: item.display_no ?? null,
    };
  });
}
