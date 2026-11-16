-- SanayiDesk MEGA 5: mechanic bonuses, desk notification counts, audit desk SELECT.

-- ---------------------------------------------------------------------------
-- mechanic_bonus_entries
-- ---------------------------------------------------------------------------
create table if not exists public.mechanic_bonus_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete restrict,
  amount numeric(12, 2) not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  created_by_user_id uuid references public.users (id) on delete set null,
  constraint mechanic_bonus_amount_positive check (amount > 0)
);

create index if not exists mechanic_bonus_workspace_created_idx
  on public.mechanic_bonus_entries (workspace_id, created_at desc);

create index if not exists mechanic_bonus_membership_idx
  on public.mechanic_bonus_entries (workspace_id, membership_id, created_at desc);

alter table public.mechanic_bonus_entries enable row level security;

drop policy if exists mechanic_bonus_select_member on public.mechanic_bonus_entries;
create policy mechanic_bonus_select_member
  on public.mechanic_bonus_entries for select to authenticated
  using (public.is_member(workspace_id));

grant select on public.mechanic_bonus_entries to authenticated;

create or replace function public.owner_add_mechanic_bonus(
  _work_order_id uuid,
  _membership_id uuid,
  _amount numeric,
  _note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  wo public.work_orders%rowtype;
  mech public.memberships%rowtype;
  actor uuid := public.current_app_user_id();
  new_id uuid;
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found or wo.workspace_id <> ws then
    raise exception 'not_found';
  end if;

  select * into mech from public.memberships where id = _membership_id;
  if not found
     or mech.workspace_id <> ws
     or not mech.is_active
     or mech.role <> 'mechanic' then
    raise exception 'invalid_mechanic';
  end if;

  if _amount is null or _amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  insert into public.mechanic_bonus_entries (
    workspace_id, work_order_id, membership_id, amount, note, created_by_user_id
  )
  values (ws, wo.id, mech.id, _amount, coalesce(_note, ''), actor)
  returning id into new_id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    ws, actor, 'bonus.add', 'mechanic_bonus_entry', new_id,
    jsonb_build_object(
      'work_order_id', wo.id,
      'membership_id', mech.id,
      'amount', _amount,
      'display_name', mech.display_name
    )
  );

  return new_id;
end;
$$;

revoke all on function public.owner_add_mechanic_bonus(uuid, uuid, numeric, text) from public;
grant execute on function public.owner_add_mechanic_bonus(uuid, uuid, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- desk_notification_counts
-- ---------------------------------------------------------------------------
create or replace view public.desk_notification_counts
with (security_invoker = true)
as
select
  w.id as workspace_id,
  (
    select count(*)::int
    from public.b2b_ledger_entries e
    where e.workspace_id = w.id
      and e.status = 'pending'
  ) as b2b_pending,
  (
    select count(*)::int
    from public.work_orders wo
    where wo.workspace_id = w.id
      and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
      and not exists (
        select 1
        from public.work_order_assignments a
        where a.work_order_id = wo.id
          and a.unassigned_at is null
      )
  ) as unassigned,
  (
    select count(*)::int
    from public.work_orders wo
    where wo.workspace_id = w.id
      and wo.status = 'ready'
  ) as ready
from public.workspaces w;

grant select on public.desk_notification_counts to authenticated;

-- ---------------------------------------------------------------------------
-- audit_logs: desk (owner + advisor) can SELECT
-- ---------------------------------------------------------------------------
drop policy if exists audit_logs_select_owner on public.audit_logs;
drop policy if exists audit_logs_select_desk on public.audit_logs;
create policy audit_logs_select_desk
  on public.audit_logs for select to authenticated
  using (public.is_desk_member(workspace_id));
