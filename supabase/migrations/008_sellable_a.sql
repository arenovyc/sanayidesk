-- SanayiDesk A Remaining Mega: shop profile, quote, inventory, low_stock notifications.

-- ---------------------------------------------------------------------------
-- Shop profile (name + settings.phone / settings.address)
-- ---------------------------------------------------------------------------
create or replace function public.owner_update_shop_profile(
  _name text,
  _phone text default null,
  _address text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  clean_name text := trim(_name);
  clean_phone text := nullif(trim(coalesce(_phone, '')), '');
  clean_address text := nullif(trim(coalesce(_address, '')), '');
  next_settings jsonb;
begin
  if clean_name = '' or char_length(clean_name) < 2 then
    raise exception 'invalid_name';
  end if;

  select coalesce(settings, '{}'::jsonb) into next_settings
  from public.workspaces where id = ws;

  if clean_phone is null then
    next_settings := next_settings - 'phone';
  else
    next_settings := jsonb_set(next_settings, '{phone}', to_jsonb(clean_phone), true);
  end if;

  if clean_address is null then
    next_settings := next_settings - 'address';
  else
    next_settings := jsonb_set(next_settings, '{address}', to_jsonb(clean_address), true);
  end if;

  update public.workspaces
  set name = clean_name, settings = next_settings
  where id = ws;

  return ws;
end;
$$;

-- Keep old RPC working (name only; does not clear phone/address).
create or replace function public.owner_update_shop_name(_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  clean text := trim(_name);
begin
  if clean = '' or char_length(clean) < 2 then
    raise exception 'invalid_name';
  end if;
  update public.workspaces set name = clean where id = ws;
  return ws;
end;
$$;

revoke all on function public.owner_update_shop_profile(text, text, text) from public;
grant execute on function public.owner_update_shop_profile(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Quote amount on work orders
-- ---------------------------------------------------------------------------
alter table public.work_orders
  add column if not exists quote_amount numeric(12, 2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'work_orders_quote_amount_nonneg'
  ) then
    alter table public.work_orders
      add constraint work_orders_quote_amount_nonneg
      check (quote_amount is null or quote_amount >= 0);
  end if;
end $$;

create or replace function public.desk_set_quote_amount(
  _work_order_id uuid,
  _quote_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  actor uuid := public.current_app_user_id();
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'forbidden';
  end if;
  if _quote_amount is not null and _quote_amount < 0 then
    raise exception 'invalid_amount';
  end if;

  update public.work_orders
  set quote_amount = _quote_amount
  where id = wo.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id, actor, 'work_order.quote', 'work_order', wo.id,
    jsonb_build_object('quote_amount', _quote_amount)
  );

  return wo.id;
end;
$$;

revoke all on function public.desk_set_quote_amount(uuid, numeric) from public;
grant execute on function public.desk_set_quote_amount(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  sku text,
  name text not null,
  qty numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2) not null default 0,
  min_qty numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_name_len check (char_length(trim(name)) >= 1),
  constraint inventory_items_qty_nonneg check (qty >= 0),
  constraint inventory_items_cost_nonneg check (unit_cost >= 0),
  constraint inventory_items_min_nonneg check (min_qty >= 0)
);

create index if not exists inventory_items_workspace_name_idx
  on public.inventory_items (workspace_id, name);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  kind text not null,
  qty numeric(12, 2) not null,
  work_order_id uuid references public.work_orders (id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now(),
  created_by_user_id uuid references public.users (id) on delete set null,
  constraint inventory_movements_kind check (kind in ('in', 'out', 'adjust')),
  constraint inventory_movements_qty_positive check (qty > 0)
);

create index if not exists inventory_movements_item_created_idx
  on public.inventory_movements (item_id, created_at desc);

create index if not exists inventory_movements_workspace_created_idx
  on public.inventory_movements (workspace_id, created_at desc);

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists inventory_items_select_member on public.inventory_items;
create policy inventory_items_select_member
  on public.inventory_items for select to authenticated
  using (public.is_member(workspace_id));

drop policy if exists inventory_movements_select_member on public.inventory_movements;
create policy inventory_movements_select_member
  on public.inventory_movements for select to authenticated
  using (public.is_member(workspace_id));

grant select on public.inventory_items to authenticated;
grant select on public.inventory_movements to authenticated;

create or replace function public.desk_inventory_upsert_item(
  _id uuid,
  _name text,
  _sku text default null,
  _unit_cost numeric default 0,
  _min_qty numeric default 0,
  _initial_qty numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  clean_name text := trim(_name);
  clean_sku text := nullif(trim(coalesce(_sku, '')), '');
  item_id uuid;
  existing public.inventory_items%rowtype;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;

  if _id is not null then
    select * into existing from public.inventory_items where id = _id;
    if not found then
      raise exception 'not_found';
    end if;
    if not public.is_desk_member(existing.workspace_id) then
      raise exception 'forbidden';
    end if;
    ws := existing.workspace_id;
  else
    select m.workspace_id into ws
    from public.memberships m
    where m.user_id = actor
      and m.is_active
      and m.role in ('owner', 'advisor')
    order by m.created_at
    limit 1;
    if ws is null then
      raise exception 'forbidden';
    end if;
  end if;

  if clean_name = '' then
    raise exception 'invalid_name';
  end if;
  if _unit_cost is null or _unit_cost < 0 then
    raise exception 'invalid_amount';
  end if;
  if _min_qty is null or _min_qty < 0 then
    raise exception 'invalid_amount';
  end if;

  if _id is null then
    if _initial_qty is null or _initial_qty < 0 then
      raise exception 'invalid_amount';
    end if;
    insert into public.inventory_items (
      workspace_id, sku, name, qty, unit_cost, min_qty
    )
    values (ws, clean_sku, clean_name, _initial_qty, _unit_cost, _min_qty)
    returning id into item_id;

    if _initial_qty > 0 then
      insert into public.inventory_movements (
        workspace_id, item_id, kind, qty, note, created_by_user_id
      )
      values (ws, item_id, 'in', _initial_qty, 'Açılış stoğu', actor);
    end if;
  else
    update public.inventory_items
    set
      sku = clean_sku,
      name = clean_name,
      unit_cost = _unit_cost,
      min_qty = _min_qty,
      updated_at = now()
    where id = _id
    returning id into item_id;
  end if;

  return item_id;
end;
$$;

create or replace function public.desk_inventory_move(
  _item_id uuid,
  _kind text,
  _qty numeric,
  _work_order_id uuid default null,
  _note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  item public.inventory_items%rowtype;
  wo public.work_orders%rowtype;
  move_id uuid;
  next_qty numeric;
begin
  select * into item from public.inventory_items where id = _item_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(item.workspace_id) then
    raise exception 'forbidden';
  end if;
  if _kind not in ('in', 'out', 'adjust') then
    raise exception 'invalid_kind';
  end if;
  if _qty is null or _qty <= 0 then
    raise exception 'invalid_amount';
  end if;

  if _work_order_id is not null then
    select * into wo from public.work_orders where id = _work_order_id;
    if not found or wo.workspace_id <> item.workspace_id then
      raise exception 'not_found';
    end if;
  end if;

  if _kind = 'in' then
    next_qty := item.qty + _qty;
  elsif _kind = 'out' then
    if item.qty < _qty then
      raise exception 'insufficient_stock';
    end if;
    next_qty := item.qty - _qty;
  else
    -- adjust: set absolute stock level to _qty
    next_qty := _qty;
  end if;

  if _kind = 'adjust' and next_qty = item.qty then
    update public.inventory_items set updated_at = now() where id = item.id;
    return item.id;
  end if;

  update public.inventory_items
  set qty = next_qty, updated_at = now()
  where id = item.id;

  insert into public.inventory_movements (
    workspace_id, item_id, kind, qty, work_order_id, note, created_by_user_id
  )
  values (
    item.workspace_id,
    item.id,
    _kind,
    case when _kind = 'adjust' then abs(next_qty - item.qty) else _qty end,
    _work_order_id,
    coalesce(_note, ''),
    actor
  )
  returning id into move_id;

  return move_id;
end;
$$;

-- Fix adjust movement qty when delta is 0 already handled; when delta > 0 ok.
-- When adjust increases, kind stays adjust with abs delta.

revoke all on function public.desk_inventory_upsert_item(uuid, text, text, numeric, numeric, numeric) from public;
revoke all on function public.desk_inventory_move(uuid, text, numeric, uuid, text) from public;
grant execute on function public.desk_inventory_upsert_item(uuid, text, text, numeric, numeric, numeric) to authenticated;
grant execute on function public.desk_inventory_move(uuid, text, numeric, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications + low_stock
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
  ) as ready,
  (
    select count(*)::int
    from public.inventory_items i
    where i.workspace_id = w.id
      and i.qty <= i.min_qty
  ) as low_stock
from public.workspaces w;

grant select on public.desk_notification_counts to authenticated;
