-- SanayiDesk MEGA 4: work order assignments, money open view, mechanic load, staff assignee.

-- ---------------------------------------------------------------------------
-- work_order_assignments (append-only; one active per work order)
-- ---------------------------------------------------------------------------
create table if not exists public.work_order_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete restrict,
  assigned_by_user_id uuid references public.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz
);

create unique index if not exists work_order_assignments_active_uidx
  on public.work_order_assignments (work_order_id)
  where unassigned_at is null;

create index if not exists work_order_assignments_mechanic_active_idx
  on public.work_order_assignments (workspace_id, membership_id)
  where unassigned_at is null;

create index if not exists work_order_assignments_wo_history_idx
  on public.work_order_assignments (work_order_id, assigned_at desc);

alter table public.work_order_assignments enable row level security;

drop policy if exists work_order_assignments_select_member on public.work_order_assignments;
create policy work_order_assignments_select_member
  on public.work_order_assignments for select to authenticated
  using (public.is_member(workspace_id));

grant select on public.work_order_assignments to authenticated;

-- ---------------------------------------------------------------------------
-- desk_assign_work_order
-- ---------------------------------------------------------------------------
create or replace function public.desk_assign_work_order(
  _work_order_id uuid,
  _membership_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  mech public.memberships%rowtype;
  actor uuid := public.current_app_user_id();
  active_id uuid;
  new_id uuid;
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  -- Clear active assignment
  if _membership_id is null then
    update public.work_order_assignments
    set unassigned_at = now()
    where work_order_id = wo.id
      and unassigned_at is null
    returning id into active_id;

    if active_id is not null then
      insert into public.audit_logs (
        workspace_id, actor_user_id, action, entity_type, entity_id, new_data
      )
      values (
        wo.workspace_id, actor, 'assignment.clear', 'work_order', wo.id,
        jsonb_build_object('assignment_id', active_id)
      );
    end if;
    return coalesce(active_id, wo.id);
  end if;

  select * into mech from public.memberships where id = _membership_id;
  if not found
     or mech.workspace_id <> wo.workspace_id
     or not mech.is_active
     or mech.role <> 'mechanic' then
    raise exception 'invalid_mechanic';
  end if;

  update public.work_order_assignments
  set unassigned_at = now()
  where work_order_id = wo.id
    and unassigned_at is null;

  insert into public.work_order_assignments (
    workspace_id, work_order_id, membership_id, assigned_by_user_id
  )
  values (wo.workspace_id, wo.id, mech.id, actor)
  returning id into new_id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id, actor, 'assignment.set', 'work_order', wo.id,
    jsonb_build_object(
      'assignment_id', new_id,
      'membership_id', mech.id,
      'display_name', mech.display_name
    )
  );

  return new_id;
end;
$$;

revoke all on function public.desk_assign_work_order(uuid, uuid) from public;
grant execute on function public.desk_assign_work_order(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- work_order_money_open (open statuses only)
-- ---------------------------------------------------------------------------
create or replace view public.work_order_money_open
with (security_invoker = true)
as
select
  wo.workspace_id,
  wo.id as work_order_id,
  coalesce((
    select sum(i.amount)::numeric(12, 2)
    from public.work_order_items i
    where i.work_order_id = wo.id
  ), 0)::numeric(12, 2) as due,
  coalesce((
    select sum(p.amount)::numeric(12, 2)
    from public.payments p
    where p.work_order_id = wo.id
      and p.method <> 'credit'
      and p.voided_at is null
  ), 0)::numeric(12, 2) as paid,
  greatest(
    coalesce((
      select sum(i.amount)::numeric(12, 2)
      from public.work_order_items i
      where i.work_order_id = wo.id
    ), 0)
    - coalesce((
      select sum(p.amount)::numeric(12, 2)
      from public.payments p
      where p.work_order_id = wo.id
        and p.method <> 'credit'
        and p.voided_at is null
    ), 0),
    0
  )::numeric(12, 2) as remaining
from public.work_orders wo
where wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready');

grant select on public.work_order_money_open to authenticated;

-- ---------------------------------------------------------------------------
-- mechanic_open_job_counts
-- ---------------------------------------------------------------------------
create or replace view public.mechanic_open_job_counts
with (security_invoker = true)
as
select
  m.workspace_id,
  m.id as membership_id,
  m.display_name,
  count(a.id)::int as open_count
from public.memberships m
left join public.work_order_assignments a
  on a.membership_id = m.id
 and a.workspace_id = m.workspace_id
 and a.unassigned_at is null
left join public.work_orders wo
  on wo.id = a.work_order_id
 and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
where m.role = 'mechanic'
  and m.is_active
group by m.workspace_id, m.id, m.display_name;

grant select on public.mechanic_open_job_counts to authenticated;

-- ---------------------------------------------------------------------------
-- staff_list_open_jobs: + assignee_name
-- ---------------------------------------------------------------------------
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
        'assignee_name', am.display_name
      )
      order by wo.opened_at desc
    )
    from public.work_orders wo
    join public.vehicles v on v.id = wo.vehicle_id
    left join public.work_order_assignments a
      on a.work_order_id = wo.id
     and a.unassigned_at is null
    left join public.memberships am on am.id = a.membership_id
    where wo.workspace_id = mem.workspace_id
      and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.staff_list_open_jobs(text) from public;
grant execute on function public.staff_list_open_jobs(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- staff_list_open_parts: + display_no
-- ---------------------------------------------------------------------------
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
    where pr.workspace_id = mem.workspace_id
      and pr.status in ('open', 'ordered')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.staff_list_open_parts(text) from public;
grant execute on function public.staff_list_open_parts(text) to anon, authenticated;
