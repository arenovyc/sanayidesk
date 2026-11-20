-- Soft-launch hardening: child rows must match parent work_order.workspace_id;
-- work_order_totals requires membership; desk membership respects suspension.

create or replace function public.work_order_matches_workspace(
  _work_order_id uuid,
  _workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.work_orders wo
    where wo.id = _work_order_id
      and wo.workspace_id = _workspace_id
  );
$$;

revoke all on function public.work_order_matches_workspace(uuid, uuid) from public;
grant execute on function public.work_order_matches_workspace(uuid, uuid) to authenticated;

-- Desk RPCs / policies: suspended shops cannot mutate via desk role helpers.
create or replace function public.is_desk_member(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.workspaces w on w.id = m.workspace_id
    where m.workspace_id = _workspace_id
      and m.user_id = public.current_app_user_id()
      and m.is_active
      and m.role in ('owner', 'advisor')
      and coalesce(w.is_suspended, false) = false
  );
$$;

create or replace function public.work_order_totals(_work_order_id uuid)
returns table (due numeric, paid numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(i.amount) from public.work_order_items i where i.work_order_id = _work_order_id
    ), 0)::numeric(12, 2) as due,
    coalesce((
      select sum(p.amount)
      from public.payments p
      where p.work_order_id = _work_order_id
        and p.method <> 'credit'
        and p.voided_at is null
    ), 0)::numeric(12, 2) as paid
  where exists (
    select 1
    from public.work_orders wo
    where wo.id = _work_order_id
      and public.is_member(wo.workspace_id)
  );
$$;

-- work_order_items
drop policy if exists work_order_items_insert_desk on public.work_order_items;
create policy work_order_items_insert_desk
  on public.work_order_items for insert to authenticated
  with check (
    public.is_desk_member(workspace_id)
    and public.work_order_matches_workspace(work_order_id, workspace_id)
  );

drop policy if exists work_order_items_update_desk on public.work_order_items;
create policy work_order_items_update_desk
  on public.work_order_items for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (
    public.is_desk_member(workspace_id)
    and public.work_order_matches_workspace(work_order_id, workspace_id)
  );

-- payments (direct insert; preferred path remains desk_add_payment RPC)
drop policy if exists payments_insert_desk on public.payments;
create policy payments_insert_desk
  on public.payments for insert to authenticated
  with check (
    public.is_desk_member(workspace_id)
    and public.work_order_matches_workspace(work_order_id, workspace_id)
  );

-- part_requests
drop policy if exists part_requests_insert_desk on public.part_requests;
create policy part_requests_insert_desk
  on public.part_requests for insert to authenticated
  with check (
    public.is_desk_member(workspace_id)
    and public.work_order_matches_workspace(work_order_id, workspace_id)
  );

drop policy if exists part_requests_update_desk on public.part_requests;
create policy part_requests_update_desk
  on public.part_requests for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (
    public.is_desk_member(workspace_id)
    and public.work_order_matches_workspace(work_order_id, workspace_id)
  );

-- media
drop policy if exists media_insert_desk on public.media;
create policy media_insert_desk
  on public.media for insert to authenticated
  with check (
    public.is_desk_member(workspace_id)
    and public.work_order_matches_workspace(work_order_id, workspace_id)
  );

-- message_events (work_order_id optional)
drop policy if exists message_events_insert_desk on public.message_events;
create policy message_events_insert_desk
  on public.message_events for insert to authenticated
  with check (
    public.is_desk_member(workspace_id)
    and (
      work_order_id is null
      or public.work_order_matches_workspace(work_order_id, workspace_id)
    )
  );
