-- SanayiDesk launch: public application leads (insert open; read via service role).

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum ('new', 'contacted', 'closed');
  end if;
end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shop_name text not null,
  city text not null default '',
  phone text not null default '',
  email text not null,
  note text not null default '',
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint leads_name_len check (char_length(trim(name)) between 2 and 80),
  constraint leads_shop_len check (char_length(trim(shop_name)) between 2 and 80),
  constraint leads_email_len check (char_length(trim(email)) between 3 and 120),
  constraint leads_note_len check (char_length(note) <= 500)
);

create index if not exists leads_created_idx
  on public.leads (created_at desc);

create index if not exists leads_status_idx
  on public.leads (status, created_at desc);

alter table public.leads enable row level security;

drop policy if exists leads_insert_anyone on public.leads;
create policy leads_insert_anyone
  on public.leads for insert
  to anon, authenticated
  with check (true);

-- No SELECT/UPDATE for anon/authenticated — platform admin uses service role.

grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to service_role;
