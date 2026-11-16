-- Faz B: remind_at, waiting_approval in open set, unpaid gate, clear remind

alter table public.work_orders
  add column if not exists remind_at timestamptz;

create index if not exists work_orders_remind_at_idx
  on public.work_orders (workspace_id, remind_at)
  where remind_at is not null and status = 'delivered';

drop index if exists public.work_orders_one_open_per_vehicle;
create unique index work_orders_one_open_per_vehicle
  on public.work_orders (vehicle_id)
  where status in (
    'intake',
    'waiting_approval',
    'in_progress',
    'waiting_parts',
    'ready'
  );

create or replace function public.work_order_can_transition(
  from_status public.work_order_status,
  to_status public.work_order_status
)
returns boolean
language sql
immutable
as $$
  select
    from_status is distinct from to_status
    and from_status not in ('delivered', 'cancelled')
    and (
      (
        from_status in (
          'intake',
          'waiting_approval',
          'in_progress',
          'waiting_parts',
          'ready'
        )
        and to_status in (
          'intake',
          'waiting_approval',
          'in_progress',
          'waiting_parts',
          'ready'
        )
      )
      or (
        to_status = 'cancelled'
        and from_status in (
          'intake',
          'waiting_approval',
          'in_progress',
          'waiting_parts',
          'ready'
        )
      )
      or (from_status = 'ready' and to_status = 'delivered')
    )
$$;

create or replace function public.staff_can_set_status(
  from_status public.work_order_status,
  to_status public.work_order_status
)
returns boolean
language sql
immutable
as $$
  select
    from_status is distinct from to_status
    and from_status in (
      'intake',
      'waiting_approval',
      'in_progress',
      'waiting_parts',
      'ready'
    )
    and to_status in (
      'intake',
      'waiting_approval',
      'in_progress',
      'waiting_parts',
      'ready'
    )
    and public.work_order_can_transition(from_status, to_status)
$$;

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
      and wo.status in (
        'intake',
        'waiting_approval',
        'in_progress',
        'waiting_parts',
        'ready'
      )
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.staff_list_open_jobs(text) from public;
grant execute on function public.staff_list_open_jobs(text) to anon, authenticated;

drop function if exists public.set_work_order_status(uuid, public.work_order_status);

create or replace function public.set_work_order_status(
  _id uuid,
  _status public.work_order_status,
  _allow_unpaid boolean default false,
  _set_remind boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  totals record;
  remaining numeric(12, 2);
  actor uuid := public.current_app_user_id();
begin
  select * into wo from public.work_orders where id = _id;
  if not found then
    raise exception 'not_found';
  end if;

  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  if not public.work_order_can_transition(wo.status, _status) then
    raise exception 'invalid_transition';
  end if;

  if _status in ('ready', 'delivered') then
    select * into totals from public.work_order_totals(wo.id);
    remaining := coalesce(totals.due, 0) - coalesce(totals.paid, 0);
    if remaining > 0 and not coalesce(_allow_unpaid, false) then
      raise exception 'unpaid_balance';
    end if;
    if remaining > 0 and coalesce(_allow_unpaid, false) then
      insert into public.audit_logs (
        workspace_id, actor_user_id, action, entity_type, entity_id, new_data
      )
      values (
        wo.workspace_id,
        actor,
        'work_order.deliver_unpaid',
        'work_order',
        wo.id,
        jsonb_build_object(
          'remaining', remaining,
          'to_status', _status::text,
          'from_status', wo.status::text
        )
      );
    end if;
  end if;

  update public.work_orders
  set
    status = _status,
    remind_at = case
      when _status = 'delivered' and coalesce(_set_remind, false) then now() + interval '10 months'
      else remind_at
    end
  where id = _id;

  return _id;
end;
$$;

revoke all on function public.set_work_order_status(
  uuid, public.work_order_status, boolean, boolean
) from public;
grant execute on function public.set_work_order_status(
  uuid, public.work_order_status, boolean, boolean
) to authenticated;

create or replace function public.desk_clear_work_order_remind(_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  actor uuid := public.current_app_user_id();
begin
  select * into wo from public.work_orders where id = _id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  update public.work_orders
  set remind_at = null
  where id = wo.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id, actor, 'work_order.remind_clear', 'work_order', wo.id,
    jsonb_build_object('cleared', true)
  );

  return wo.id;
end;
$$;

revoke all on function public.desk_clear_work_order_remind(uuid) from public;
grant execute on function public.desk_clear_work_order_remind(uuid) to authenticated;
