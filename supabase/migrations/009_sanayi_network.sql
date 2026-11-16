-- SanayiDesk B Network Mega: appointments, cross-plate, network/B2B link,
-- platform billing stub, inventory transfers.

-- ---------------------------------------------------------------------------
-- B-P4: workspace suspension + trial
-- ---------------------------------------------------------------------------
alter table public.workspaces
  add column if not exists is_suspended boolean not null default false;

alter table public.workspaces
  add column if not exists trial_ends_at timestamptz;

update public.workspaces
set trial_ends_at = coalesce(trial_ends_at, created_at + interval '30 days')
where trial_ends_at is null;

create or replace function public.register_shop(
  _name text,
  _slug text,
  _full_name text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_user_id uuid;
  new_workspace_id uuid;
  clean_slug text := lower(trim(_slug));
  clean_name text := trim(_name);
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if clean_name = '' then
    raise exception 'shop_name_required';
  end if;

  if clean_slug is null or clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_slug';
  end if;

  if exists (select 1 from public.users where auth_user_id = uid) then
    raise exception 'already_registered';
  end if;

  if exists (select 1 from public.workspaces where slug = clean_slug) then
    raise exception 'slug_taken';
  end if;

  insert into public.users (auth_user_id, full_name)
  values (uid, coalesce(nullif(trim(_full_name), ''), ''))
  returning id into new_user_id;

  insert into public.workspaces (name, slug, type, trial_ends_at)
  values (clean_name, clean_slug, 'repair', now() + interval '30 days')
  returning id into new_workspace_id;

  insert into public.memberships (user_id, workspace_id, role, display_name)
  values (
    new_user_id,
    new_workspace_id,
    'owner',
    coalesce(nullif(trim(_full_name), ''), clean_name)
  );

  return new_workspace_id;
end;
$$;

create or replace function public.pin_login(_slug text, _pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ws public.workspaces%rowtype;
  mem public.memberships%rowtype;
  raw_token text;
  th text;
begin
  select * into ws
  from public.workspaces
  where slug = lower(trim(_slug));

  if not found then
    raise exception 'invalid_credentials';
  end if;

  if ws.is_suspended then
    raise exception 'workspace_suspended';
  end if;

  if not public.is_valid_pin(_pin) then
    raise exception 'invalid_credentials';
  end if;

  for mem in
    select *
    from public.memberships m
    where m.workspace_id = ws.id
      and m.is_active
      and m.role in ('mechanic', 'apprentice')
      and m.pin_hash is not null
    order by m.created_at
    for update
  loop
    if mem.pin_locked_until is not null and mem.pin_locked_until > now() then
      continue;
    end if;
    if mem.pin_hash = crypt(_pin, mem.pin_hash) then
      update public.memberships
      set pin_failed_count = 0, pin_locked_until = null
      where id = mem.id;

      raw_token := encode(gen_random_bytes(32), 'hex');
      th := public.sha256_hex(raw_token);

      insert into public.staff_sessions (membership_id, token_hash, expires_at)
      values (mem.id, th, now() + interval '12 hours');

      return jsonb_build_object(
        'token', raw_token,
        'role', mem.role,
        'display_name', mem.display_name,
        'workspace_name', ws.name,
        'workspace_slug', ws.slug
      );
    end if;
  end loop;

  select * into mem
  from public.memberships m
  where m.workspace_id = ws.id
    and m.is_active
    and m.role in ('mechanic', 'apprentice')
    and m.pin_hash is not null
  order by m.created_at
  limit 1
  for update;

  if found then
    if mem.pin_locked_until is not null and mem.pin_locked_until > now() then
      raise exception 'pin_locked';
    end if;

    update public.memberships
    set
      pin_failed_count = pin_failed_count + 1,
      pin_locked_until = case
        when pin_failed_count + 1 >= 5 then now() + interval '15 minutes'
        else pin_locked_until
      end
    where id = mem.id;

    if (select pin_failed_count from public.memberships where id = mem.id) >= 5 then
      raise exception 'pin_locked';
    end if;
  end if;

  raise exception 'invalid_credentials';
end;
$$;

create or replace function public.staff_whoami(_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  mem public.memberships%rowtype;
  ws public.workspaces%rowtype;
begin
  mem := public.staff_membership_from_token(_token);
  select * into ws from public.workspaces where id = mem.workspace_id;
  if not found then
    raise exception 'invalid_token';
  end if;
  return jsonb_build_object(
    'membership_id', mem.id,
    'user_id', mem.user_id,
    'workspace_id', mem.workspace_id,
    'role', mem.role,
    'display_name', mem.display_name,
    'workspace_name', ws.name,
    'workspace_slug', ws.slug,
    'is_suspended', ws.is_suspended
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- B-P1: appointments
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'appointment_status'
  ) then
    create type public.appointment_status as enum (
      'scheduled',
      'arrived',
      'cancelled',
      'no_show',
      'converted'
    );
  end if;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  plate text not null,
  customer_id uuid references public.customers (id) on delete set null,
  scheduled_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes text not null default '',
  work_order_id uuid references public.work_orders (id) on delete set null,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_plate_format check (plate ~ '^[A-Z0-9]{3,12}$'),
  constraint appointments_notes_len check (char_length(notes) <= 500)
);

create index if not exists appointments_workspace_scheduled_idx
  on public.appointments (workspace_id, scheduled_at);

create index if not exists appointments_workspace_scheduled_open_idx
  on public.appointments (workspace_id, scheduled_at)
  where status = 'scheduled';

alter table public.appointments enable row level security;

drop policy if exists appointments_select_member on public.appointments;
create policy appointments_select_member
  on public.appointments for select to authenticated
  using (public.is_member(workspace_id));

grant select on public.appointments to authenticated;

create or replace function public.desk_create_appointment(
  _plate text,
  _scheduled_at timestamptz,
  _notes text default '',
  _customer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  plate text := public.normalize_plate(_plate);
  note text := trim(coalesce(_notes, ''));
  new_id uuid;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;

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

  if plate !~ '^[A-Z0-9]{3,12}$' then
    raise exception 'invalid_plate';
  end if;

  if _scheduled_at is null then
    raise exception 'invalid_time';
  end if;

  if _customer_id is not null then
    if not exists (
      select 1 from public.customers c
      where c.id = _customer_id and c.workspace_id = ws
    ) then
      raise exception 'not_found';
    end if;
  end if;

  insert into public.appointments (
    workspace_id, plate, customer_id, scheduled_at, notes, created_by_user_id
  )
  values (ws, plate, _customer_id, _scheduled_at, note, actor)
  returning id into new_id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    ws, actor, 'appointment.create', 'appointment', new_id,
    jsonb_build_object('plate', plate, 'scheduled_at', _scheduled_at)
  );

  return new_id;
end;
$$;

create or replace function public.desk_update_appointment_status(
  _appointment_id uuid,
  _status public.appointment_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  appt public.appointments%rowtype;
begin
  select * into appt from public.appointments where id = _appointment_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(appt.workspace_id) then
    raise exception 'forbidden';
  end if;

  if _status not in (
    'scheduled'::public.appointment_status,
    'arrived'::public.appointment_status,
    'cancelled'::public.appointment_status,
    'no_show'::public.appointment_status,
    'converted'::public.appointment_status
  ) then
    raise exception 'invalid_status';
  end if;

  if appt.status = 'converted' and _status <> 'converted' then
    raise exception 'invalid_status';
  end if;

  update public.appointments
  set status = _status, updated_at = now()
  where id = appt.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, old_data, new_data
  )
  values (
    appt.workspace_id, actor, 'appointment.status', 'appointment', appt.id,
    jsonb_build_object('status', appt.status),
    jsonb_build_object('status', _status)
  );

  return appt.id;
end;
$$;

create or replace function public.desk_convert_appointment_to_job(
  _appointment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  appt public.appointments%rowtype;
  result jsonb;
  wo_id uuid;
begin
  select * into appt from public.appointments where id = _appointment_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(appt.workspace_id) then
    raise exception 'forbidden';
  end if;
  if appt.status in ('cancelled', 'converted') then
    raise exception 'invalid_status';
  end if;

  result := public.accept_work_order(appt.plate, '', '', coalesce(appt.notes, ''));
  wo_id := (result ->> 'id')::uuid;

  update public.appointments
  set
    status = 'converted',
    work_order_id = wo_id,
    updated_at = now()
  where id = appt.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    appt.workspace_id, actor, 'appointment.convert', 'appointment', appt.id,
    jsonb_build_object('work_order_id', wo_id, 'plate', appt.plate)
  );

  return wo_id;
end;
$$;

revoke all on function public.desk_create_appointment(text, timestamptz, text, uuid) from public;
revoke all on function public.desk_update_appointment_status(uuid, public.appointment_status) from public;
revoke all on function public.desk_convert_appointment_to_job(uuid) from public;
grant execute on function public.desk_create_appointment(text, timestamptz, text, uuid) to authenticated;
grant execute on function public.desk_update_appointment_status(uuid, public.appointment_status) to authenticated;
grant execute on function public.desk_convert_appointment_to_job(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- B-P2 / B-P3: network + privacy settings RPCs
-- ---------------------------------------------------------------------------
create or replace function public.owner_update_network_settings(
  _share_vehicle_history boolean,
  _network_visible boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  next_settings jsonb;
begin
  select coalesce(settings, '{}'::jsonb) into next_settings
  from public.workspaces where id = ws;

  next_settings := jsonb_set(
    next_settings,
    '{share_vehicle_history}',
    to_jsonb(coalesce(_share_vehicle_history, false)),
    true
  );
  next_settings := jsonb_set(
    next_settings,
    '{network_visible}',
    to_jsonb(coalesce(_network_visible, false)),
    true
  );

  update public.workspaces
  set settings = next_settings
  where id = ws;

  return ws;
end;
$$;

revoke all on function public.owner_update_network_settings(boolean, boolean) from public;
grant execute on function public.owner_update_network_settings(boolean, boolean) to authenticated;

create or replace function public.desk_lookup_shared_plate_history(_plate text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  plate text := public.normalize_plate(_plate);
  payload jsonb := '[]'::jsonb;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;

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

  if plate !~ '^[A-Z0-9]{3,12}$' then
    raise exception 'invalid_plate';
  end if;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.last_at desc nulls last), '[]'::jsonb)
  into payload
  from (
    select
      w.id as workspace_id,
      w.name as workspace_name,
      plate as plate,
      count(wo.id)::int as job_count,
      max(wo.opened_at) as last_at,
      (
        select wo2.status::text
        from public.work_orders wo2
        join public.vehicles v2 on v2.id = wo2.vehicle_id
        where v2.workspace_id = w.id
          and v2.plate_normalized = plate
        order by wo2.opened_at desc
        limit 1
      ) as last_status
    from public.workspaces w
    join public.vehicles v
      on v.workspace_id = w.id
     and v.plate_normalized = plate
    left join public.work_orders wo
      on wo.vehicle_id = v.id
    where w.id <> ws
      and coalesce((w.settings ->> 'share_vehicle_history')::boolean, false) = true
    group by w.id, w.name
  ) t;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    ws, actor, 'shared_plate_lookup', 'vehicle', null,
    jsonb_build_object('plate', plate, 'result_count', jsonb_array_length(payload))
  );

  return payload;
end;
$$;

revoke all on function public.desk_lookup_shared_plate_history(text) from public;
grant execute on function public.desk_lookup_shared_plate_history(text) to authenticated;

create or replace function public.list_network_shops()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  payload jsonb;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;

  select m.workspace_id into ws
  from public.memberships m
  where m.user_id = actor and m.is_active
  order by m.created_at
  limit 1;

  if ws is null then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.name), '[]'::jsonb)
  into payload
  from (
    select
      w.id,
      w.name,
      w.slug,
      w.type::text as type,
      coalesce(w.settings ->> 'phone', '') as phone,
      coalesce(w.settings ->> 'address', '') as address,
      (w.id = ws) as is_mine
    from public.workspaces w
    where coalesce((w.settings ->> 'network_visible')::boolean, false) = true
      and w.is_suspended = false
  ) t;

  return payload;
end;
$$;

revoke all on function public.list_network_shops() from public;
grant execute on function public.list_network_shops() to authenticated;

-- ---------------------------------------------------------------------------
-- B-P3: B2B linked workspace
-- ---------------------------------------------------------------------------
alter table public.external_parties
  add column if not exists linked_workspace_id uuid
    references public.workspaces (id) on delete set null;

create or replace function public.desk_set_party_linked_workspace(
  _party_id uuid,
  _linked_workspace_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  party public.external_parties%rowtype;
begin
  select * into party from public.external_parties where id = _party_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(party.workspace_id) then
    raise exception 'forbidden';
  end if;

  if _linked_workspace_id is not null then
    if _linked_workspace_id = party.workspace_id then
      raise exception 'invalid_link';
    end if;
    if not exists (
      select 1 from public.workspaces w where w.id = _linked_workspace_id
    ) then
      raise exception 'not_found';
    end if;
  end if;

  update public.external_parties
  set linked_workspace_id = _linked_workspace_id
  where id = party.id;

  return party.id;
end;
$$;

revoke all on function public.desk_set_party_linked_workspace(uuid, uuid) from public;
grant execute on function public.desk_set_party_linked_workspace(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- B-P5: inventory transfer requests
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'inventory_transfer_status'
  ) then
    create type public.inventory_transfer_status as enum (
      'pending',
      'approved',
      'rejected',
      'cancelled'
    );
  end if;
end $$;

create table if not exists public.inventory_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  from_workspace_id uuid not null references public.workspaces (id) on delete cascade,
  to_workspace_id uuid not null references public.workspaces (id) on delete cascade,
  from_item_id uuid not null references public.inventory_items (id) on delete restrict,
  qty numeric(12, 2) not null,
  note text not null default '',
  status public.inventory_transfer_status not null default 'pending',
  created_by_user_id uuid references public.users (id) on delete set null,
  responded_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint inventory_transfer_qty_positive check (qty > 0),
  constraint inventory_transfer_distinct_ws check (from_workspace_id <> to_workspace_id),
  constraint inventory_transfer_note_len check (char_length(note) <= 300)
);

create index if not exists inventory_transfer_from_idx
  on public.inventory_transfer_requests (from_workspace_id, status, created_at desc);

create index if not exists inventory_transfer_to_idx
  on public.inventory_transfer_requests (to_workspace_id, status, created_at desc);

alter table public.inventory_transfer_requests enable row level security;

drop policy if exists inventory_transfer_select_party on public.inventory_transfer_requests;
create policy inventory_transfer_select_party
  on public.inventory_transfer_requests for select to authenticated
  using (
    public.is_member(from_workspace_id)
    or public.is_member(to_workspace_id)
  );

grant select on public.inventory_transfer_requests to authenticated;

create or replace function public.desk_request_inventory_transfer(
  _from_item_id uuid,
  _to_workspace_id uuid,
  _qty numeric,
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
  new_id uuid;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;

  select * into item from public.inventory_items where id = _from_item_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(item.workspace_id) then
    raise exception 'forbidden';
  end if;

  if _to_workspace_id is null or _to_workspace_id = item.workspace_id then
    raise exception 'invalid_target';
  end if;

  if not exists (select 1 from public.workspaces w where w.id = _to_workspace_id) then
    raise exception 'not_found';
  end if;

  if _qty is null or _qty <= 0 then
    raise exception 'invalid_amount';
  end if;

  if item.qty < _qty then
    raise exception 'insufficient_stock';
  end if;

  insert into public.inventory_transfer_requests (
    from_workspace_id, to_workspace_id, from_item_id, qty, note, created_by_user_id
  )
  values (
    item.workspace_id, _to_workspace_id, item.id, _qty,
    trim(coalesce(_note, '')), actor
  )
  returning id into new_id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    item.workspace_id, actor, 'inventory.transfer_request', 'inventory_transfer', new_id,
    jsonb_build_object(
      'to_workspace_id', _to_workspace_id,
      'from_item_id', item.id,
      'qty', _qty
    )
  );

  return new_id;
end;
$$;

create or replace function public.desk_respond_inventory_transfer(
  _request_id uuid,
  _approve boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  req public.inventory_transfer_requests%rowtype;
  src public.inventory_items%rowtype;
  dest public.inventory_items%rowtype;
  dest_id uuid;
  note_out text;
  note_in text;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;

  select * into req
  from public.inventory_transfer_requests
  where id = _request_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if req.status <> 'pending' then
    raise exception 'invalid_status';
  end if;

  if not public.is_desk_member(req.to_workspace_id) then
    raise exception 'forbidden';
  end if;

  if not _approve then
    update public.inventory_transfer_requests
    set
      status = 'rejected',
      responded_by_user_id = actor,
      responded_at = now()
    where id = req.id;

    insert into public.audit_logs (
      workspace_id, actor_user_id, action, entity_type, entity_id, new_data
    )
    values (
      req.to_workspace_id, actor, 'inventory.transfer_reject', 'inventory_transfer', req.id,
      jsonb_build_object('from_workspace_id', req.from_workspace_id)
    );

    return req.id;
  end if;

  select * into src from public.inventory_items where id = req.from_item_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if src.qty < req.qty then
    raise exception 'insufficient_stock';
  end if;

  note_out := 'Transfer çıkış #' || left(req.id::text, 8);
  note_in := 'Transfer giriş #' || left(req.id::text, 8);

  update public.inventory_items
  set qty = qty - req.qty, updated_at = now()
  where id = src.id;

  insert into public.inventory_movements (
    workspace_id, item_id, kind, qty, note, created_by_user_id
  )
  values (src.workspace_id, src.id, 'out', req.qty, note_out, actor);

  select * into dest
  from public.inventory_items
  where workspace_id = req.to_workspace_id
    and (
      (src.sku is not null and sku = src.sku)
      or (src.sku is null and lower(name) = lower(src.name))
    )
  order by created_at
  limit 1
  for update;

  if found then
    dest_id := dest.id;
    update public.inventory_items
    set qty = qty + req.qty, updated_at = now()
    where id = dest_id;
  else
    insert into public.inventory_items (
      workspace_id, sku, name, qty, unit_cost, min_qty
    )
    values (
      req.to_workspace_id, src.sku, src.name, req.qty, src.unit_cost, src.min_qty
    )
    returning id into dest_id;
  end if;

  insert into public.inventory_movements (
    workspace_id, item_id, kind, qty, note, created_by_user_id
  )
  values (req.to_workspace_id, dest_id, 'in', req.qty, note_in, actor);

  update public.inventory_transfer_requests
  set
    status = 'approved',
    responded_by_user_id = actor,
    responded_at = now()
  where id = req.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    req.to_workspace_id, actor, 'inventory.transfer_approve', 'inventory_transfer', req.id,
    jsonb_build_object(
      'from_workspace_id', req.from_workspace_id,
      'qty', req.qty,
      'dest_item_id', dest_id
    )
  );

  return req.id;
end;
$$;

create or replace function public.desk_cancel_inventory_transfer(_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  req public.inventory_transfer_requests%rowtype;
begin
  select * into req from public.inventory_transfer_requests where id = _request_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(req.from_workspace_id) then
    raise exception 'forbidden';
  end if;
  if req.status <> 'pending' then
    raise exception 'invalid_status';
  end if;

  update public.inventory_transfer_requests
  set status = 'cancelled', responded_by_user_id = actor, responded_at = now()
  where id = req.id;

  return req.id;
end;
$$;

revoke all on function public.desk_request_inventory_transfer(uuid, uuid, numeric, text) from public;
revoke all on function public.desk_respond_inventory_transfer(uuid, boolean) from public;
revoke all on function public.desk_cancel_inventory_transfer(uuid) from public;
grant execute on function public.desk_request_inventory_transfer(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.desk_respond_inventory_transfer(uuid, boolean) to authenticated;
grant execute on function public.desk_cancel_inventory_transfer(uuid) to authenticated;
