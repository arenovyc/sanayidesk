-- SanayiDesk Faz 3: vehicles, optional customers, work orders.
-- No line items, payments, loaners, or PIN.

create type public.work_order_status as enum (
  'intake',
  'in_progress',
  'waiting_parts',
  'ready',
  'delivered',
  'cancelled'
);

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
    where m.workspace_id = _workspace_id
      and m.user_id = public.current_app_user_id()
      and m.is_active
      and m.role in ('owner', 'advisor')
  )
$$;

-- Match src/lib/format/plate.ts: strip space/dot/hyphen/underscore, fold Turkish, ASCII upper.
create or replace function public.normalize_plate(raw text)
returns text
language sql
immutable
as $$
  select upper(
    translate(
      regexp_replace(trim(coalesce(raw, '')), '[\s.\-_]', '', 'g'),
      'çğıiöşüÇĞİÖŞÜ',
      'CGIIOSUCGIOSU'
    )
  )
$$;

create or replace function public.normalize_phone(raw text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(raw, ''), '[^0-9]', '', 'g'), '')
$$;

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
        from_status in ('intake', 'in_progress', 'waiting_parts', 'ready')
        and to_status in ('intake', 'in_progress', 'waiting_parts', 'ready')
      )
      or (
        to_status = 'cancelled'
        and from_status in ('intake', 'in_progress', 'waiting_parts', 'ready')
      )
      or (from_status = 'ready' and to_status = 'delivered')
    )
$$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

create unique index customers_workspace_phone_idx
  on public.customers (workspace_id, phone)
  where phone is not null;

create index customers_workspace_idx on public.customers (workspace_id);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  plate_normalized text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, plate_normalized),
  constraint vehicles_plate_format check (plate_normalized ~ '^[A-Z0-9]{3,12}$')
);

create index vehicles_workspace_idx on public.vehicles (workspace_id);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete set null,
  status public.work_order_status not null default 'intake',
  complaint text not null default '',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by_user_id uuid references public.users (id) on delete set null
);

create unique index work_orders_one_open_per_vehicle
  on public.work_orders (vehicle_id)
  where status in ('intake', 'in_progress', 'waiting_parts', 'ready');

create index work_orders_workspace_status_opened_idx
  on public.work_orders (workspace_id, status, opened_at desc);

create or replace function public.work_orders_before_update()
returns trigger
language plpgsql
as $$
begin
  if NEW.status in ('delivered', 'cancelled')
     and OLD.status not in ('delivered', 'cancelled') then
    NEW.closed_at := coalesce(NEW.closed_at, now());
  end if;
  return NEW;
end;
$$;

create trigger work_orders_before_update
  before update on public.work_orders
  for each row
  execute function public.work_orders_before_update();

create or replace function public.work_orders_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (
      workspace_id, actor_user_id, action, entity_type, entity_id, new_data
    )
    values (
      NEW.workspace_id,
      public.current_app_user_id(),
      'work_order.create',
      'work_order',
      NEW.id,
      to_jsonb(NEW)
    );
    return NEW;
  end if;

  if NEW.status is distinct from OLD.status then
    insert into public.audit_logs (
      workspace_id, actor_user_id, action, entity_type, entity_id, old_data, new_data
    )
    values (
      NEW.workspace_id,
      public.current_app_user_id(),
      'work_order.status',
      'work_order',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  end if;
  return NEW;
end;
$$;

create trigger work_orders_audit
  after insert or update on public.work_orders
  for each row
  execute function public.work_orders_audit();

create or replace function public.accept_work_order(
  _plate text,
  _full_name text default '',
  _phone text default '',
  _complaint text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  plate text := public.normalize_plate(_plate);
  phone text := public.normalize_phone(_phone);
  cust_name text := trim(coalesce(_full_name, ''));
  note text := trim(coalesce(_complaint, ''));
  veh_id uuid;
  cust_id uuid;
  existing_id uuid;
  new_id uuid;
begin
  if actor is null then
    raise exception 'not_authenticated';
  end if;

  select m.workspace_id
    into ws
  from public.memberships m
  where m.user_id = actor
    and m.is_active
    and m.role in ('owner', 'advisor')
  order by m.created_at
  limit 1;

  if ws is null then
    raise exception 'not_desk';
  end if;

  if plate !~ '^[A-Z0-9]{3,12}$' then
    raise exception 'invalid_plate';
  end if;

  select v.id
    into veh_id
  from public.vehicles v
  where v.workspace_id = ws
    and v.plate_normalized = plate;

  if veh_id is not null then
    select wo.id
      into existing_id
    from public.work_orders wo
    where wo.vehicle_id = veh_id
      and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
    limit 1;

    if existing_id is not null then
      return jsonb_build_object('id', existing_id, 'created', false);
    end if;
  end if;

  if phone is not null then
    insert into public.customers (workspace_id, full_name, phone)
    values (ws, cust_name, phone)
    on conflict (workspace_id, phone) where phone is not null
    do update set
      full_name = case
        when excluded.full_name <> '' then excluded.full_name
        else public.customers.full_name
      end
    returning id into cust_id;
  elsif cust_name <> '' then
    insert into public.customers (workspace_id, full_name)
    values (ws, cust_name)
    returning id into cust_id;
  end if;

  insert into public.vehicles (workspace_id, customer_id, plate_normalized)
  values (ws, cust_id, plate)
  on conflict (workspace_id, plate_normalized)
  do update set
    customer_id = coalesce(excluded.customer_id, public.vehicles.customer_id)
  returning id into veh_id;

  begin
    insert into public.work_orders (
      workspace_id, vehicle_id, customer_id, status, complaint, created_by_user_id
    )
    values (ws, veh_id, cust_id, 'intake', note, actor)
    returning id into new_id;
  exception
    when unique_violation then
      select wo.id
        into existing_id
      from public.work_orders wo
      where wo.vehicle_id = veh_id
        and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
      limit 1;
      if existing_id is null then
        raise;
      end if;
      return jsonb_build_object('id', existing_id, 'created', false);
  end;

  return jsonb_build_object('id', new_id, 'created', true);
end;
$$;

create or replace function public.set_work_order_status(
  _id uuid,
  _status public.work_order_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
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

  update public.work_orders
  set status = _status
  where id = _id;

  return _id;
end;
$$;

revoke all on function public.is_desk_member(uuid) from public;
revoke all on function public.normalize_plate(text) from public;
revoke all on function public.normalize_phone(text) from public;
revoke all on function public.work_order_can_transition(public.work_order_status, public.work_order_status) from public;
revoke all on function public.accept_work_order(text, text, text, text) from public;
revoke all on function public.set_work_order_status(uuid, public.work_order_status) from public;

grant execute on function public.is_desk_member(uuid) to authenticated;
grant execute on function public.normalize_plate(text) to authenticated;
grant execute on function public.normalize_phone(text) to authenticated;
grant execute on function public.work_order_can_transition(public.work_order_status, public.work_order_status) to authenticated;
grant execute on function public.accept_work_order(text, text, text, text) to authenticated;
grant execute on function public.set_work_order_status(uuid, public.work_order_status) to authenticated;

alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.work_orders enable row level security;

create policy customers_select_member
  on public.customers for select to authenticated
  using (public.is_member(workspace_id));

create policy customers_insert_desk
  on public.customers for insert to authenticated
  with check (public.is_desk_member(workspace_id));

create policy customers_update_desk
  on public.customers for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (public.is_desk_member(workspace_id));

create policy vehicles_select_member
  on public.vehicles for select to authenticated
  using (public.is_member(workspace_id));

create policy vehicles_insert_desk
  on public.vehicles for insert to authenticated
  with check (public.is_desk_member(workspace_id));

create policy vehicles_update_desk
  on public.vehicles for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (public.is_desk_member(workspace_id));

create policy work_orders_select_member
  on public.work_orders for select to authenticated
  using (public.is_member(workspace_id));

create policy work_orders_insert_desk
  on public.work_orders for insert to authenticated
  with check (public.is_desk_member(workspace_id));

create policy work_orders_update_desk
  on public.work_orders for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (public.is_desk_member(workspace_id));

grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.vehicles to authenticated;
grant select, insert, update on public.work_orders to authenticated;
