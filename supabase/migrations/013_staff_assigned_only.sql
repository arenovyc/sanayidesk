-- Faz A: usta PIN only sees jobs assigned to them (and parts on those jobs)

create or replace function public.staff_list_open_jobs(_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  mem public.memberships%rowtype;
begin
  mem := public.staff_membership_from_token(_token);
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', wo.id,
        'status', wo.status,
        'complaint', wo.complaint,
        'plate', v.plate_normalized,
        'display_no', wo.display_no,
        'assignee_name', am.display_name,
        'make_model', v.make_model
      )
      order by wo.opened_at desc
    )
    from public.work_orders wo
    join public.vehicles v on v.id = wo.vehicle_id
    join public.work_order_assignments a
      on a.work_order_id = wo.id
     and a.unassigned_at is null
     and a.membership_id = mem.id
    left join public.memberships am on am.id = a.membership_id
    where wo.workspace_id = mem.workspace_id
      and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.staff_list_open_jobs(text) from public;
grant execute on function public.staff_list_open_jobs(text) to anon, authenticated;

create or replace function public.staff_list_open_parts(_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  mem public.memberships%rowtype;
begin
  mem := public.staff_membership_from_token(_token);
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', pr.id,
        'description', pr.description,
        'status', pr.status,
        'work_order_id', pr.work_order_id,
        'plate', v.plate_normalized,
        'display_no', wo.display_no
      )
      order by pr.created_at desc
    )
    from public.part_requests pr
    join public.work_orders wo on wo.id = pr.work_order_id
    join public.vehicles v on v.id = wo.vehicle_id
    join public.work_order_assignments a
      on a.work_order_id = wo.id
     and a.unassigned_at is null
     and a.membership_id = mem.id
    where pr.workspace_id = mem.workspace_id
      and pr.status in ('open', 'ordered')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.staff_list_open_parts(text) from public;
grant execute on function public.staff_list_open_parts(text) to anon, authenticated;
