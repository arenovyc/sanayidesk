-- SanayiDesk MEGA 2: display_no, media/storage, message_events, payment void, B2B.
-- Run once after 003_app_ops.sql. Do not re-run 001–003.

-- ---------------------------------------------------------------------------
-- display_no
-- ---------------------------------------------------------------------------
alter table public.work_orders
  add column if not exists display_no text;

create unique index if not exists work_orders_workspace_display_no_uidx
  on public.work_orders (workspace_id, display_no)
  where display_no is not null;

create table if not exists public.workspace_sequences (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  year int not null,
  counter int not null default 0,
  primary key (workspace_id, year),
  constraint workspace_sequences_year_ok check (year between 2000 and 2100),
  constraint workspace_sequences_counter_nonneg check (counter >= 0)
);

create or replace function public.next_work_order_display_no(_workspace_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from timezone('Europe/Istanbul', now()))::int;
  n int;
begin
  insert into public.workspace_sequences (workspace_id, year, counter)
  values (_workspace_id, y, 1)
  on conflict (workspace_id, year) do update
    set counter = public.workspace_sequences.counter + 1
  returning counter into n;

  return y::text || '-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function public.work_orders_assign_display_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.display_no is null or trim(new.display_no) = '' then
    new.display_no := public.next_work_order_display_no(new.workspace_id);
  end if;
  return new;
end;
$$;

drop trigger if exists work_orders_assign_display_no on public.work_orders;
create trigger work_orders_assign_display_no
  before insert on public.work_orders
  for each row
  execute function public.work_orders_assign_display_no();

-- Backfill existing rows (ordered by opened_at)
do $$
declare
  r record;
  y int;
  n int;
begin
  for r in
    select id, workspace_id, opened_at
    from public.work_orders
    where display_no is null
    order by workspace_id, opened_at asc, id asc
  loop
    y := extract(year from timezone('Europe/Istanbul', r.opened_at))::int;
    insert into public.workspace_sequences (workspace_id, year, counter)
    values (r.workspace_id, y, 1)
    on conflict (workspace_id, year) do update
      set counter = public.workspace_sequences.counter + 1
    returning counter into n;

    update public.work_orders
    set display_no = y::text || '-' || lpad(n::text, 4, '0')
    where id = r.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- media + storage bucket
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  storage_path text not null,
  content_type text not null default 'image/jpeg',
  byte_size int not null default 0,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_by_membership_id uuid references public.memberships (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint media_path_len check (char_length(trim(storage_path)) between 8 and 500),
  constraint media_byte_size_nonneg check (byte_size >= 0)
);

create index if not exists media_work_order_idx
  on public.media (work_order_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('work-order-media', 'work-order-media', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- message_events
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.message_channel as enum ('whatsapp_manual');
exception when duplicate_object then null;
end $$;

create table if not exists public.message_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_order_id uuid references public.work_orders (id) on delete set null,
  channel public.message_channel not null default 'whatsapp_manual',
  payload jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_by_membership_id uuid references public.memberships (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists message_events_workspace_idx
  on public.message_events (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- payment void
-- ---------------------------------------------------------------------------
alter table public.payments
  add column if not exists voided_at timestamptz;

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
$$;

create or replace function public.desk_void_payment(_payment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  pay public.payments%rowtype;
  wo public.work_orders%rowtype;
  actor uuid := public.current_app_user_id();
begin
  select * into pay from public.payments where id = _payment_id;
  if not found or pay.workspace_id <> ws then
    raise exception 'not_found';
  end if;
  if pay.voided_at is not null then
    raise exception 'already_voided';
  end if;

  select * into wo from public.work_orders where id = pay.work_order_id;

  update public.payments set voided_at = now() where id = pay.id;

  if wo.customer_id is not null then
    if pay.method = 'credit' then
      insert into public.customer_ledger_entries (
        workspace_id, customer_id, work_order_id, payment_id, delta, note
      )
      values (
        pay.workspace_id, wo.customer_id, wo.id, pay.id, -pay.amount, 'Veresiye iptal'
      );
    else
      insert into public.customer_ledger_entries (
        workspace_id, customer_id, work_order_id, payment_id, delta, note
      )
      values (
        pay.workspace_id, wo.customer_id, wo.id, pay.id, pay.amount, 'Tahsilat iptal'
      );
    end if;
  end if;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    pay.workspace_id, actor, 'payment.void', 'payment', pay.id,
    jsonb_build_object('amount', pay.amount, 'method', pay.method)
  );

  return pay.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- staff / desk media + message RPCs
-- ---------------------------------------------------------------------------
create or replace function public.staff_register_media(
  _token text,
  _work_order_id uuid,
  _storage_path text,
  _content_type text default 'image/jpeg',
  _byte_size int default 0
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
  path text := trim(_storage_path);
begin
  mem := public.staff_membership_from_token(_token);
  select * into wo from public.work_orders where id = _work_order_id;
  if not found or wo.workspace_id <> mem.workspace_id then
    raise exception 'not_found';
  end if;
  if path = '' or char_length(path) < 8 then
    raise exception 'invalid_path';
  end if;

  insert into public.media (
    workspace_id, work_order_id, storage_path, content_type, byte_size,
    created_by_membership_id
  )
  values (
    mem.workspace_id, wo.id, path, coalesce(nullif(trim(_content_type), ''), 'image/jpeg'),
    greatest(coalesce(_byte_size, 0), 0), mem.id
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.desk_log_message_event(
  _work_order_id uuid,
  _payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  actor uuid := public.current_app_user_id();
  new_id uuid;
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  insert into public.message_events (
    workspace_id, work_order_id, channel, payload, created_by_user_id
  )
  values (
    wo.workspace_id, wo.id, 'whatsapp_manual', coalesce(_payload, '{}'::jsonb), actor
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.staff_log_message_event(
  _token text,
  _work_order_id uuid,
  _payload jsonb default '{}'::jsonb
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
begin
  mem := public.staff_membership_from_token(_token);
  select * into wo from public.work_orders where id = _work_order_id;
  if not found or wo.workspace_id <> mem.workspace_id then
    raise exception 'not_found';
  end if;

  insert into public.message_events (
    workspace_id, work_order_id, channel, payload, created_by_membership_id
  )
  values (
    mem.workspace_id, wo.id, 'whatsapp_manual', coalesce(_payload, '{}'::jsonb), mem.id
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- B2B
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.b2b_entry_direction as enum ('we_owe', 'they_owe');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.b2b_entry_status as enum ('pending', 'confirmed', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.external_parties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  phone text not null default '',
  note text not null default '',
  linked_directory_id uuid references public.directory_contacts (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint external_parties_name_len check (char_length(trim(name)) between 1 and 80)
);

create index if not exists external_parties_workspace_idx
  on public.external_parties (workspace_id, created_at desc);

create table if not exists public.b2b_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  external_party_id uuid not null references public.external_parties (id) on delete cascade,
  amount numeric(12, 2) not null,
  direction public.b2b_entry_direction not null,
  status public.b2b_entry_status not null default 'pending',
  note text not null default '',
  work_order_id uuid references public.work_orders (id) on delete set null,
  confirmed_at timestamptz,
  confirmed_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by_user_id uuid references public.users (id) on delete set null,
  constraint b2b_ledger_amount_positive check (amount > 0)
);

create index if not exists b2b_ledger_workspace_status_idx
  on public.b2b_ledger_entries (workspace_id, status, created_at desc);

create or replace function public.desk_create_b2b_entry(
  _external_party_id uuid,
  _amount numeric,
  _direction public.b2b_entry_direction,
  _note text default '',
  _work_order_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  party public.external_parties%rowtype;
  actor uuid := public.current_app_user_id();
  new_id uuid;
  wo public.work_orders%rowtype;
begin
  select * into party from public.external_parties where id = _external_party_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(party.workspace_id) then
    raise exception 'not_desk';
  end if;
  if _amount is null or _amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  if _work_order_id is not null then
    select * into wo from public.work_orders where id = _work_order_id;
    if not found or wo.workspace_id <> party.workspace_id then
      raise exception 'not_found';
    end if;
  end if;

  insert into public.b2b_ledger_entries (
    workspace_id, external_party_id, amount, direction, status, note,
    work_order_id, created_by_user_id
  )
  values (
    party.workspace_id, party.id, _amount, _direction, 'pending',
    coalesce(_note, ''), _work_order_id, actor
  )
  returning id into new_id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    party.workspace_id, actor, 'b2b.create', 'b2b_ledger_entry', new_id,
    jsonb_build_object('amount', _amount, 'direction', _direction, 'status', 'pending')
  );

  return new_id;
end;
$$;

create or replace function public.owner_confirm_b2b_entry(_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  entry public.b2b_ledger_entries%rowtype;
  actor uuid := public.current_app_user_id();
begin
  select * into entry from public.b2b_ledger_entries where id = _id;
  if not found or entry.workspace_id <> ws then
    raise exception 'not_found';
  end if;
  if entry.status <> 'pending' then
    raise exception 'invalid_status';
  end if;

  update public.b2b_ledger_entries
  set status = 'confirmed', confirmed_at = now(), confirmed_by_user_id = actor
  where id = entry.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    ws, actor, 'b2b.confirm', 'b2b_ledger_entry', entry.id,
    jsonb_build_object('status', 'confirmed')
  );

  return entry.id;
end;
$$;

create or replace function public.owner_reject_b2b_entry(_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := public.require_owner_workspace();
  entry public.b2b_ledger_entries%rowtype;
  actor uuid := public.current_app_user_id();
begin
  select * into entry from public.b2b_ledger_entries where id = _id;
  if not found or entry.workspace_id <> ws then
    raise exception 'not_found';
  end if;
  if entry.status <> 'pending' then
    raise exception 'invalid_status';
  end if;

  update public.b2b_ledger_entries
  set status = 'rejected', confirmed_at = now(), confirmed_by_user_id = actor
  where id = entry.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    ws, actor, 'b2b.reject', 'b2b_ledger_entry', entry.id,
    jsonb_build_object('status', 'rejected')
  );

  return entry.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS / grants
-- ---------------------------------------------------------------------------
alter table public.media enable row level security;
alter table public.message_events enable row level security;
alter table public.external_parties enable row level security;
alter table public.b2b_ledger_entries enable row level security;
alter table public.workspace_sequences enable row level security;

drop policy if exists media_select_member on public.media;
create policy media_select_member
  on public.media for select to authenticated
  using (public.is_member(workspace_id));
drop policy if exists media_insert_desk on public.media;
create policy media_insert_desk
  on public.media for insert to authenticated
  with check (public.is_desk_member(workspace_id));

drop policy if exists message_events_select_member on public.message_events;
create policy message_events_select_member
  on public.message_events for select to authenticated
  using (public.is_member(workspace_id));
drop policy if exists message_events_insert_desk on public.message_events;
create policy message_events_insert_desk
  on public.message_events for insert to authenticated
  with check (public.is_desk_member(workspace_id));

drop policy if exists external_parties_select_member on public.external_parties;
create policy external_parties_select_member
  on public.external_parties for select to authenticated
  using (public.is_member(workspace_id));
drop policy if exists external_parties_insert_desk on public.external_parties;
create policy external_parties_insert_desk
  on public.external_parties for insert to authenticated
  with check (public.is_desk_member(workspace_id));
drop policy if exists external_parties_update_desk on public.external_parties;
create policy external_parties_update_desk
  on public.external_parties for update to authenticated
  using (public.is_desk_member(workspace_id))
  with check (public.is_desk_member(workspace_id));
drop policy if exists external_parties_delete_desk on public.external_parties;
create policy external_parties_delete_desk
  on public.external_parties for delete to authenticated
  using (public.is_desk_member(workspace_id));

drop policy if exists b2b_ledger_select_member on public.b2b_ledger_entries;
create policy b2b_ledger_select_member
  on public.b2b_ledger_entries for select to authenticated
  using (public.is_member(workspace_id));
drop policy if exists b2b_ledger_insert_desk on public.b2b_ledger_entries;
create policy b2b_ledger_insert_desk
  on public.b2b_ledger_entries for insert to authenticated
  with check (
    public.is_desk_member(workspace_id)
    and status = 'pending'
  );

-- Storage policies (desk path: first folder = workspace_id)
drop policy if exists work_order_media_select on storage.objects;
create policy work_order_media_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'work-order-media'
    and public.is_member((string_to_array(name, '/'))[1]::uuid)
  );

drop policy if exists work_order_media_insert on storage.objects;
create policy work_order_media_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'work-order-media'
    and public.is_desk_member((string_to_array(name, '/'))[1]::uuid)
  );

revoke all on function public.next_work_order_display_no(uuid) from public;
revoke all on function public.desk_void_payment(uuid) from public;
revoke all on function public.staff_register_media(text, uuid, text, text, int) from public;
revoke all on function public.desk_log_message_event(uuid, jsonb) from public;
revoke all on function public.staff_log_message_event(text, uuid, jsonb) from public;
revoke all on function public.desk_create_b2b_entry(uuid, numeric, public.b2b_entry_direction, text, uuid) from public;
revoke all on function public.owner_confirm_b2b_entry(uuid) from public;
revoke all on function public.owner_reject_b2b_entry(uuid) from public;

grant execute on function public.next_work_order_display_no(uuid) to authenticated;
grant execute on function public.desk_void_payment(uuid) to authenticated;
grant execute on function public.staff_register_media(text, uuid, text, text, int) to anon, authenticated;
grant execute on function public.desk_log_message_event(uuid, jsonb) to authenticated;
grant execute on function public.staff_log_message_event(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.desk_create_b2b_entry(uuid, numeric, public.b2b_entry_direction, text, uuid) to authenticated;
grant execute on function public.owner_confirm_b2b_entry(uuid) to authenticated;
grant execute on function public.owner_reject_b2b_entry(uuid) to authenticated;
grant execute on function public.work_order_totals(uuid) to authenticated;

grant select, insert on public.media to authenticated;
grant select, insert on public.message_events to authenticated;
grant select, insert, update, delete on public.external_parties to authenticated;
grant select, insert on public.b2b_ledger_entries to authenticated;
grant select on public.workspace_sequences to authenticated;
