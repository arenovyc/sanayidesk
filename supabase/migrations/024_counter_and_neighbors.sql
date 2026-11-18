-- Sanayi Sürümü: plakasız tezgâh WO + neighbor_requests + gölge cari.
-- accept_work_order değiştirilmez.

-- ---------------------------------------------------------------------------
-- work_orders: nullable vehicle + counter_title
-- ---------------------------------------------------------------------------
alter table public.work_orders
  alter column vehicle_id drop not null;

alter table public.work_orders
  add column if not exists counter_title text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'work_orders_vehicle_xor_counter'
  ) then
    alter table public.work_orders
      add constraint work_orders_vehicle_xor_counter
      check (
        (vehicle_id is null) = (nullif(trim(coalesce(counter_title, '')), '') is not null)
      );
  end if;
end $$;

drop index if exists public.work_orders_one_open_per_vehicle;

create unique index work_orders_one_open_per_vehicle
  on public.work_orders (vehicle_id)
  where vehicle_id is not null
    and status in ('intake', 'in_progress', 'waiting_parts', 'ready', 'waiting_approval');

comment on column public.work_orders.counter_title is
  'Plakasız tezgâh siparişi/işi başlığı (parca/torna)';

-- ---------------------------------------------------------------------------
-- desk_accept_counter_order
-- ---------------------------------------------------------------------------
create or replace function public.desk_accept_counter_order(
  _title text,
  _full_name text default '',
  _phone text default '',
  _note text default '',
  _amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  title text := nullif(trim(coalesce(_title, '')), '');
  cust_phone text := public.normalize_phone(_phone);
  cust_name text := trim(coalesce(_full_name, ''));
  note text := trim(coalesce(_note, ''));
  cust_id uuid;
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

  if title is null or char_length(title) < 2 then
    raise exception 'invalid_counter_title';
  end if;

  if cust_phone is not null then
    insert into public.customers (workspace_id, full_name, phone)
    values (ws, coalesce(nullif(cust_name, ''), title), cust_phone)
    on conflict (workspace_id, phone) where (customers.phone is not null)
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

  insert into public.work_orders (
    workspace_id,
    vehicle_id,
    customer_id,
    status,
    complaint,
    counter_title,
    created_by_user_id
  )
  values (
    ws,
    null,
    cust_id,
    'intake',
    note,
    title,
    actor
  )
  returning id into new_id;

  if _amount is not null and _amount > 0 then
    insert into public.work_order_items (
      workspace_id, work_order_id, kind, description, amount
    )
    values (
      ws, new_id, 'part', title, _amount
    );
  end if;

  return jsonb_build_object('id', new_id, 'created', true);
end;
$$;

revoke all on function public.desk_accept_counter_order(text, text, text, text, numeric) from public;
grant execute on function public.desk_accept_counter_order(text, text, text, text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- desk_set_counter_status (tezgâh WO)
-- ---------------------------------------------------------------------------
create or replace function public.desk_set_counter_status(
  _id uuid,
  _status public.work_order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  wo public.work_orders%rowtype;
begin
  if actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into wo from public.work_orders where id = _id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;
  if wo.vehicle_id is not null or nullif(trim(coalesce(wo.counter_title, '')), '') is null then
    raise exception 'not_counter_order';
  end if;
  if _status not in ('intake', 'in_progress', 'ready', 'delivered', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  update public.work_orders
  set status = _status,
      closed_at = case
        when _status in ('delivered', 'cancelled') then coalesce(closed_at, now())
        else null
      end
  where id = wo.id;
end;
$$;

revoke all on function public.desk_set_counter_status(uuid, public.work_order_status) from public;
grant execute on function public.desk_set_counter_status(uuid, public.work_order_status) to authenticated;

-- ---------------------------------------------------------------------------
-- neighbor_requests
-- ---------------------------------------------------------------------------
create table if not exists public.neighbor_requests (
  id uuid primary key default gen_random_uuid(),
  from_workspace_id uuid not null references public.workspaces (id) on delete cascade,
  to_workspace_id uuid references public.workspaces (id) on delete cascade,
  directory_contact_id uuid references public.directory_contacts (id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint neighbor_requests_kind_check check (
    kind in ('parca_sorusu', 'is_paslama', 'stok_transfer_istegi')
  ),
  constraint neighbor_requests_status_check check (
    status in ('open', 'accepted', 'rejected', 'wa_sent')
  ),
  constraint neighbor_requests_target_check check (
    to_workspace_id is not null or directory_contact_id is not null
  )
);

create index if not exists neighbor_requests_from_idx
  on public.neighbor_requests (from_workspace_id, created_at desc);
create index if not exists neighbor_requests_to_idx
  on public.neighbor_requests (to_workspace_id, status, created_at desc)
  where to_workspace_id is not null;

alter table public.neighbor_requests enable row level security;

drop policy if exists neighbor_requests_select_member on public.neighbor_requests;
create policy neighbor_requests_select_member
  on public.neighbor_requests for select to authenticated
  using (
    public.is_member(from_workspace_id)
    or (to_workspace_id is not null and public.is_member(to_workspace_id))
  );

drop policy if exists neighbor_requests_insert_desk on public.neighbor_requests;
create policy neighbor_requests_insert_desk
  on public.neighbor_requests for insert to authenticated
  with check (public.is_desk_member(from_workspace_id));

drop policy if exists neighbor_requests_update_member on public.neighbor_requests;
create policy neighbor_requests_update_member
  on public.neighbor_requests for update to authenticated
  using (
    public.is_desk_member(from_workspace_id)
    or (to_workspace_id is not null and public.is_desk_member(to_workspace_id))
  );

grant select, insert, update on public.neighbor_requests to authenticated;

-- ---------------------------------------------------------------------------
-- desk_ensure_shadow_party
-- ---------------------------------------------------------------------------
create or replace function public.desk_ensure_shadow_party(
  _name text,
  _phone text default '',
  _note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  clean_name text := trim(coalesce(_name, ''));
  clean_phone text := coalesce(public.normalize_phone(_phone), '');
  clean_note text := trim(coalesce(_note, ''));
  dir_id uuid;
  party_id uuid;
begin
  if actor is null then
    raise exception 'not_authenticated';
  end if;

  select m.workspace_id into ws
  from public.memberships m
  where m.user_id = actor and m.is_active and m.role in ('owner', 'advisor')
  order by m.created_at limit 1;

  if ws is null then
    raise exception 'not_desk';
  end if;
  if char_length(clean_name) < 2 then
    raise exception 'invalid_name';
  end if;

  if clean_phone <> '' then
    select id into dir_id
    from public.directory_contacts
    where workspace_id = ws and phone = clean_phone
    limit 1;
  end if;

  if dir_id is null then
    select id into dir_id
    from public.directory_contacts
    where workspace_id = ws and lower(name) = lower(clean_name)
    limit 1;
  end if;

  if dir_id is null then
    insert into public.directory_contacts (workspace_id, name, phone, note)
    values (ws, clean_name, clean_phone, clean_note)
    returning id into dir_id;
  else
    update public.directory_contacts
    set
      phone = case when clean_phone <> '' then clean_phone else phone end,
      note = case when clean_note <> '' then clean_note else note end
    where id = dir_id;
  end if;

  select id into party_id
  from public.external_parties
  where workspace_id = ws and linked_directory_id = dir_id
  limit 1;

  if party_id is null then
    insert into public.external_parties (
      workspace_id, name, phone, note, linked_directory_id
    )
    values (ws, clean_name, clean_phone, 'Gölge cari (Komşular)', dir_id)
    returning id into party_id;
  end if;

  return jsonb_build_object(
    'directoryId', dir_id,
    'partyId', party_id
  );
end;
$$;

revoke all on function public.desk_ensure_shadow_party(text, text, text) from public;
grant execute on function public.desk_ensure_shadow_party(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- desk_create_neighbor_request
-- ---------------------------------------------------------------------------
create or replace function public.desk_create_neighbor_request(
  _kind text,
  _payload jsonb default '{}'::jsonb,
  _to_workspace_id uuid default null,
  _directory_contact_id uuid default null,
  _status text default 'open'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  new_id uuid;
  st text := coalesce(nullif(trim(_status), ''), 'open');
begin
  if actor is null then
    raise exception 'not_authenticated';
  end if;

  select m.workspace_id into ws
  from public.memberships m
  where m.user_id = actor and m.is_active and m.role in ('owner', 'advisor')
  order by m.created_at limit 1;

  if ws is null then
    raise exception 'not_desk';
  end if;

  if _kind not in ('parca_sorusu', 'is_paslama', 'stok_transfer_istegi') then
    raise exception 'invalid_kind';
  end if;
  if st not in ('open', 'accepted', 'rejected', 'wa_sent') then
    raise exception 'invalid_status';
  end if;
  if _to_workspace_id is null and _directory_contact_id is null then
    raise exception 'target_required';
  end if;
  if _to_workspace_id is not null and _to_workspace_id = ws then
    raise exception 'invalid_target';
  end if;

  insert into public.neighbor_requests (
    from_workspace_id,
    to_workspace_id,
    directory_contact_id,
    kind,
    payload,
    status,
    created_by_user_id
  )
  values (
    ws,
    _to_workspace_id,
    _directory_contact_id,
    _kind,
    coalesce(_payload, '{}'::jsonb),
    st,
    actor
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.desk_create_neighbor_request(text, jsonb, uuid, uuid, text) from public;
grant execute on function public.desk_create_neighbor_request(text, jsonb, uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- desk_respond_neighbor_request
-- ---------------------------------------------------------------------------
create or replace function public.desk_respond_neighbor_request(
  _id uuid,
  _status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  req public.neighbor_requests%rowtype;
begin
  if actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into req from public.neighbor_requests where id = _id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if req.to_workspace_id is null or not public.is_desk_member(req.to_workspace_id) then
    raise exception 'not_desk';
  end if;
  if _status not in ('accepted', 'rejected') then
    raise exception 'invalid_status';
  end if;

  update public.neighbor_requests
  set status = _status, responded_at = now()
  where id = req.id;
end;
$$;

revoke all on function public.desk_respond_neighbor_request(uuid, text) from public;
grant execute on function public.desk_respond_neighbor_request(uuid, text) to authenticated;
