-- SanayiDesk Faz 1: identity, RLS, shop registration.
-- Domain tables (customers, work_orders, payments, ...) arrive in Faz 3.

create extension if not exists "pgcrypto";

create type public.workspace_type as enum ('repair');
create type public.membership_role as enum ('owner', 'advisor', 'mechanic', 'apprentice');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.workspace_type not null default 'repair',
  plan text not null default 'trial',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  role public.membership_role not null,
  display_name text not null default '',
  pin_hash text,
  pin_failed_count integer not null default 0,
  pin_locked_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, workspace_id)
);

comment on column public.memberships.pin_hash is
  'Faz 2: hashed 4-digit PIN. Never grant this column to authenticated.';

create table public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.staff_sessions is 'Faz 2 PIN sessions. No client grants in Faz 1.';

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id uuid references public.users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index memberships_workspace_role_idx on public.memberships (workspace_id, role);
create index memberships_user_idx on public.memberships (user_id);
create index audit_logs_workspace_created_idx on public.audit_logs (workspace_id, created_at desc);
create index staff_sessions_membership_idx on public.staff_sessions (membership_id);

-- Helpers are SECURITY DEFINER so RLS policies can call them without recursion.
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_member(_workspace_id uuid)
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
  )
$$;

create or replace function public.is_workspace_owner(_workspace_id uuid)
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
      and m.role = 'owner'
  )
$$;

create or replace function public.slug_taken(_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspaces w where w.slug = _slug
  )
$$;

create or replace function public.register_shop(_name text, _slug text, _full_name text default '')
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

  insert into public.workspaces (name, slug, type)
  values (clean_name, clean_slug, 'repair')
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

revoke all on function public.current_app_user_id() from public;
revoke all on function public.is_member(uuid) from public;
revoke all on function public.is_workspace_owner(uuid) from public;
revoke all on function public.slug_taken(text) from public;
revoke all on function public.register_shop(text, text, text) from public;

grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.slug_taken(text) to anon, authenticated;
grant execute on function public.register_shop(text, text, text) to authenticated;

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.staff_sessions enable row level security;
alter table public.audit_logs enable row level security;

create policy users_select_own
  on public.users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy users_update_own
  on public.users
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy workspaces_select_member
  on public.workspaces
  for select
  to authenticated
  using (public.is_member(id));

create policy memberships_select_member
  on public.memberships
  for select
  to authenticated
  using (public.is_member(workspace_id));

create policy audit_logs_select_owner
  on public.audit_logs
  for select
  to authenticated
  using (public.is_workspace_owner(workspace_id));

grant usage on schema public to anon, authenticated;

grant select, update on public.users to authenticated;
grant select on public.workspaces to authenticated;
grant select (id, user_id, workspace_id, role, display_name, is_active, created_at)
  on public.memberships to authenticated;
grant select on public.audit_logs to authenticated;

-- No grants on staff_sessions or memberships.pin_hash.

-- Faz 3 (not created here): customers, vehicles, loaner_vehicles, work_orders,
-- work_order_items, payments, customer_ledger_entries, directory_contacts, media, message_events.
-- Faz 7: external_parties / confirmed B2B ledger. Do not use workspaces.is_shadow.
