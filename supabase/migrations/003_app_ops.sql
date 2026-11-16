-- SanayiDesk MEGA: PIN/staff, parts, payments, directory.
-- Run once after 001_identity.sql and 002_work_core.sql.

-- ---------------------------------------------------------------------------
-- PIN-only users (no auth.users row)
-- ---------------------------------------------------------------------------
alter table public.users
  alter column auth_user_id drop not null;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.part_request_status as enum (
  'open',
  'ordered',
  'arrived',
  'cancelled'
);

create type public.work_order_item_kind as enum ('labor', 'part', 'other');

create type public.payment_method as enum ('cash', 'card', 'transfer', 'credit');

create type public.invoice_mode as enum ('invoiced', 'uninvoiced');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.sha256_hex(raw text)
returns text
language sql
immutable
as $$
  select encode(digest(raw, 'sha256'), 'hex')
$$;

create or replace function public.is_valid_pin(_pin text)
returns boolean
language sql
immutable
as $$
  select _pin ~ '^[0-9]{4}$'
$$;

create or replace function public.staff_membership_from_token(_token text)
returns public.memberships
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m public.memberships%rowtype;
  th text := public.sha256_hex(_token);
begin
  if _token is null or length(_token) < 16 then
    raise exception 'invalid_token';
  end if;

  select mem.*
    into m
  from public.staff_sessions s
  join public.memberships mem on mem.id = s.membership_id
  where s.token_hash = th
    and s.expires_at > now()
    and mem.is_active
    and mem.role in ('mechanic', 'apprentice')
  limit 1;

  if not found then
    raise exception 'invalid_token';
  end if;

  return m;
end;
$$;

create or replace function public.require_owner_workspace()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ws uuid;
begin
  select m.workspace_id
    into ws
  from public.memberships m
  where m.user_id = public.current_app_user_id()
    and m.is_active
    and m.role = 'owner'
  order by m.created_at
  limit 1;

  if ws is null then
    raise exception 'not_owner';
  end if;
  return ws;
end;
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
    and from_status in ('intake', 'in_progress', 'waiting_parts', 'ready')
    and to_status in ('intake', 'in_progress', 'waiting_parts', 'ready')
    and public.work_order_can_transition(from_status, to_status)
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.part_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  description text not null,
  status public.part_request_status not null default 'open',
  created_by_membership_id uuid references public.memberships (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint part_requests_description_len check (char_length(trim(description)) between 1 and 200)
);

create index part_requests_workspace_status_idx
  on public.part_requests (workspace_id, status, created_at desc);
create index part_requests_work_order_idx
  on public.part_requests (work_order_id);

create table public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  kind public.work_order_item_kind not null default 'labor',
  description text not null,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint work_order_items_amount_positive check (amount > 0),
  constraint work_order_items_description_len check (char_length(trim(description)) between 1 and 200)
);

create index work_order_items_work_order_idx on public.work_order_items (work_order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  amount numeric(12, 2) not null,
  method public.payment_method not null,
  invoice_mode public.invoice_mode not null default 'uninvoiced',
  paid_at timestamptz not null default now(),
  note text not null default '',
  created_by_user_id uuid references public.users (id) on delete set null,
  constraint payments_amount_positive check (amount > 0)
);

create index payments_workspace_paid_idx on public.payments (workspace_id, paid_at desc);
create index payments_work_order_idx on public.payments (work_order_id);

create table public.customer_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  work_order_id uuid references public.work_orders (id) on delete set null,
  payment_id uuid references public.payments (id) on delete set null,
  delta numeric(12, 2) not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint customer_ledger_delta_nonzero check (delta <> 0)
);

create index customer_ledger_customer_idx
  on public.customer_ledger_entries (customer_id, created_at desc);

create table public.directory_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  phone text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint directory_contacts_name_len check (char_length(trim(name)) between 1 and 80)
);

create index directory_contacts_workspace_idx on public.directory_contacts (workspace_id);

-- ---------------------------------------------------------------------------
-- PIN login / logout / whoami
-- ---------------------------------------------------------------------------
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

create or replace function public.pin_logout(_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.staff_sessions
  where token_hash = public.sha256_hex(_token);
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
    'workspace_slug', ws.slug
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff work order / parts
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
        'plate', v.plate_normalized
      )
      order by wo.opened_at desc
    )
    from public.work_orders wo
    join public.vehicles v on v.id = wo.vehicle_id
    where wo.workspace_id = mem.workspace_id
      and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
  ), '[]'::jsonb);
end;
$$;

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
        'plate', v.plate_normalized
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

create or replace function public.staff_set_work_order_status(
  _token text,
  _id uuid,
  _status public.work_order_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  mem public.memberships%rowtype;
  wo public.work_orders%rowtype;
begin
  mem := public.staff_membership_from_token(_token);
  if mem.role <> 'mechanic' then
    raise exception 'not_mechanic';
  end if;

  select * into wo from public.work_orders where id = _id;
  if not found or wo.workspace_id <> mem.workspace_id then
    raise exception 'not_found';
  end if;

  if not public.staff_can_set_status(wo.status, _status) then
    raise exception 'invalid_transition';
  end if;

  update public.work_orders set status = _status where id = _id;
  return _id;
end;
$$;

create or replace function public.staff_request_parts(
  _token text,
  _work_order_id uuid,
  _description text default 'Parça lazım'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  mem public.memberships%rowtype;
  wo public.work_orders%rowtype;
  new_id uuid;
  note text := nullif(trim(_description), '');
begin
  mem := public.staff_membership_from_token(_token);
  if mem.role not in ('mechanic', 'apprentice') then
    raise exception 'not_staff';
  end if;

  select * into wo from public.work_orders where id = _work_order_id;
  if not found or wo.workspace_id <> mem.workspace_id then
    raise exception 'not_found';
  end if;

  if wo.status not in ('intake', 'in_progress', 'waiting_parts', 'ready') then
    raise exception 'invalid_transition';
  end if;

  insert into public.part_requests (
    workspace_id, work_order_id, description, status, created_by_membership_id
  )
  values (
    mem.workspace_id,
    wo.id,
    coalesce(note, 'Parça lazım'),
    'open',
    mem.id
  )
  returning id into new_id;

  if wo.status is distinct from 'waiting_parts' then
    update public.work_orders set status = 'waiting_parts' where id = wo.id;
  end if;

  return new_id;
end;
$$;

create or replace function public.staff_set_part_status(
  _token text,
  _id uuid,
  _status public.part_request_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  mem public.memberships%rowtype;
  pr public.part_requests%rowtype;
begin
  mem := public.staff_membership_from_token(_token);

  select * into pr from public.part_requests where id = _id;
  if not found or pr.workspace_id <> mem.workspace_id then
    raise exception 'not_found';
  end if;

  if _status not in ('open', 'ordered', 'arrived', 'cancelled') then
    raise exception 'invalid_transition';
  end if;

  update public.part_requests set status = _status where id = _id;
  return _id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Owner team PIN members
-- ---------------------------------------------------------------------------
create or replace function public.owner_add_pin_member(
  _display_name text,
  _role public.membership_role,
  _pin text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  new_user uuid;
  new_mem uuid;
  name text := trim(_display_name);
begin
  if _role not in ('mechanic', 'apprentice') then
    raise exception 'invalid_role';
  end if;
  if name = '' or char_length(name) < 2 then
    raise exception 'invalid_name';
  end if;
  if not public.is_valid_pin(_pin) then
    raise exception 'invalid_pin';
  end if;

  insert into public.users (auth_user_id, full_name)
  values (null, name)
  returning id into new_user;

  insert into public.memberships (
    user_id, workspace_id, role, display_name, pin_hash
  )
  values (
    new_user, ws, _role, name, crypt(_pin, gen_salt('bf'))
  )
  returning id into new_mem;

  return new_mem;
end;
$$;

create or replace function public.owner_set_member_pin(
  _membership_id uuid,
  _pin text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  mem public.memberships%rowtype;
begin
  if not public.is_valid_pin(_pin) then
    raise exception 'invalid_pin';
  end if;

  select * into mem from public.memberships where id = _membership_id;
  if not found or mem.workspace_id <> ws then
    raise exception 'not_found';
  end if;
  if mem.role not in ('mechanic', 'apprentice') then
    raise exception 'invalid_role';
  end if;

  update public.memberships
  set
    pin_hash = crypt(_pin, gen_salt('bf')),
    pin_failed_count = 0,
    pin_locked_until = null
  where id = mem.id;

  delete from public.staff_sessions where membership_id = mem.id;
  return mem.id;
end;
$$;

create or replace function public.owner_set_member_active(
  _membership_id uuid,
  _active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  mem public.memberships%rowtype;
begin
  select * into mem from public.memberships where id = _membership_id;
  if not found or mem.workspace_id <> ws then
    raise exception 'not_found';
  end if;
  if mem.role = 'owner' then
    raise exception 'cannot_disable_owner';
  end if;

  update public.memberships set is_active = _active where id = mem.id;
  if not _active then
    delete from public.staff_sessions where membership_id = mem.id;
  end if;
  return mem.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Desk payments / items helpers
-- ---------------------------------------------------------------------------
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
    ), 0)::numeric(12, 2) as paid
$$;

create or replace function public.desk_add_payment(
  _work_order_id uuid,
  _amount numeric,
  _method public.payment_method,
  _invoice_mode public.invoice_mode default 'uninvoiced',
  _note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  totals record;
  payment_id uuid;
  actor uuid := public.current_app_user_id();
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;
  if _amount is null or _amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into totals from public.work_order_totals(wo.id);
  if totals.due <= 0 then
    raise exception 'no_items';
  end if;

  if _method <> 'credit' and totals.paid + _amount > totals.due then
    raise exception 'overpay';
  end if;

  insert into public.payments (
    workspace_id, work_order_id, amount, method, invoice_mode, note, created_by_user_id
  )
  values (
    wo.workspace_id, wo.id, _amount, _method, _invoice_mode, coalesce(_note, ''), actor
  )
  returning id into payment_id;

  if wo.customer_id is not null then
    if _method = 'credit' then
      insert into public.customer_ledger_entries (
        workspace_id, customer_id, work_order_id, payment_id, delta, note
      )
      values (
        wo.workspace_id, wo.customer_id, wo.id, payment_id, _amount, 'Veresiye'
      );
    else
      insert into public.customer_ledger_entries (
        workspace_id, customer_id, work_order_id, payment_id, delta, note
      )
      values (
        wo.workspace_id, wo.customer_id, wo.id, payment_id, -_amount, 'Tahsilat'
      );
    end if;
  end if;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id, actor, 'payment.create', 'payment', payment_id,
    jsonb_build_object('amount', _amount, 'method', _method)
  );

  return payment_id;
end;
$$;

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

-- ---------------------------------------------------------------------------
-- Grants / RLS
-- ---------------------------------------------------------------------------
revoke all on function public.sha256_hex(text) from public;
revoke all on function public.is_valid_pin(text) from public;
revoke all on function public.staff_membership_from_token(text) from public;
revoke all on function public.require_owner_workspace() from public;
revoke all on function public.staff_can_set_status(public.work_order_status, public.work_order_status) from public;
revoke all on function public.pin_login(text, text) from public;
revoke all on function public.pin_logout(text) from public;
revoke all on function public.staff_whoami(text) from public;
revoke all on function public.staff_list_open_jobs(text) from public;
revoke all on function public.staff_list_open_parts(text) from public;
revoke all on function public.staff_set_work_order_status(text, uuid, public.work_order_status) from public;
revoke all on function public.staff_request_parts(text, uuid, text) from public;
revoke all on function public.staff_set_part_status(text, uuid, public.part_request_status) from public;
revoke all on function public.owner_add_pin_member(text, public.membership_role, text) from public;
revoke all on function public.owner_set_member_pin(uuid, text) from public;
revoke all on function public.owner_set_member_active(uuid, boolean) from public;
revoke all on function public.work_order_totals(uuid) from public;
revoke all on function public.desk_add_payment(uuid, numeric, public.payment_method, public.invoice_mode, text) from public;
revoke all on function public.owner_update_shop_name(text) from public;

grant execute on function public.pin_login(text, text) to anon, authenticated;
grant execute on function public.pin_logout(text) to anon, authenticated;
grant execute on function public.staff_whoami(text) to anon, authenticated;
grant execute on function public.staff_list_open_jobs(text) to anon, authenticated;
grant execute on function public.staff_list_open_parts(text) to anon, authenticated;
grant execute on function public.staff_set_work_order_status(text, uuid, public.work_order_status) to anon, authenticated;
grant execute on function public.staff_request_parts(text, uuid, text) to anon, authenticated;
grant execute on function public.staff_set_part_status(text, uuid, public.part_request_status) to anon, authenticated;
grant execute on function public.owner_add_pin_member(text, public.membership_role, text) to authenticated;
grant execute on function public.owner_set_member_pin(uuid, text) to authenticated;
grant execute on function public.owner_set_member_active(uuid, boolean) to authenticated;
grant execute on function public.work_order_totals(uuid) to authenticated;
grant execute on function public.desk_add_payment(uuid, numeric, public.payment_method, public.invoice_mode, text) to authenticated;
grant execute on function public.owner_update_shop_name(text) to authenticated;
grant execute on function public.staff_can_set_status(public.work_order_status, public.work_order_status) to authenticated;

alter table public.part_requests enable row level security;
alter table public.work_order_items enable row level security;
alter table public.payments enable row level security;
alter table public.customer_ledger_entries enable row level security;
alter table public.directory_contacts enable row level security;

create policy part_requests_select_member
  on public.part_requests for select to authenticated
  using (public.is_member(workspace_id));
create policy part_requests_insert_desk
  on public.part_requests for insert to authenticated
  with check (public.is_desk_member(workspace_id));
create policy part_requests_update_desk
  on public.part_requests for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (public.is_desk_member(workspace_id));

create policy work_order_items_select_member
  on public.work_order_items for select to authenticated
  using (public.is_member(workspace_id));
create policy work_order_items_insert_desk
  on public.work_order_items for insert to authenticated
  with check (public.is_desk_member(workspace_id));
create policy work_order_items_update_desk
  on public.work_order_items for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (public.is_desk_member(workspace_id));
create policy work_order_items_delete_desk
  on public.work_order_items for delete to authenticated
  using (public.is_desk_member(workspace_id));

create policy payments_select_member
  on public.payments for select to authenticated
  using (public.is_member(workspace_id));
create policy payments_insert_desk
  on public.payments for insert to authenticated
  with check (public.is_desk_member(workspace_id));

create policy ledger_select_member
  on public.customer_ledger_entries for select to authenticated
  using (public.is_member(workspace_id));

create policy directory_select_member
  on public.directory_contacts for select to authenticated
  using (public.is_member(workspace_id));
create policy directory_insert_desk
  on public.directory_contacts for insert to authenticated
  with check (public.is_desk_member(workspace_id));
create policy directory_update_desk
  on public.directory_contacts for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (public.is_desk_member(workspace_id));
create policy directory_delete_desk
  on public.directory_contacts for delete to authenticated
  using (public.is_desk_member(workspace_id));

grant select, insert, update on public.part_requests to authenticated;
grant select, insert, update, delete on public.work_order_items to authenticated;
grant select, insert on public.payments to authenticated;
grant select on public.customer_ledger_entries to authenticated;
grant select, insert, update, delete on public.directory_contacts to authenticated;
