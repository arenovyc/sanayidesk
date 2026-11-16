-- Self-serve shop meta: city_district, owner phone on register, sample intake job.

alter table public.workspaces
  add column if not exists city_district text;

comment on column public.workspaces.city_district is
  'Kayıt: İl / İlçe (örn. Ankara / Ostim)';

drop function if exists public.register_shop(text, text, text);

create or replace function public.register_shop(
  _name text,
  _slug text,
  _full_name text default '',
  _owner_phone text default '',
  _city_district text default ''
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
  clean_full_name text := coalesce(nullif(trim(_full_name), ''), '');
  owner_phone text := public.normalize_phone(_owner_phone);
  clean_city text := nullif(trim(_city_district), '');
  sample_customer_id uuid;
  sample_vehicle_id uuid;
  sample_settings jsonb;
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

  insert into public.users (auth_user_id, full_name, phone)
  values (uid, clean_full_name, owner_phone)
  returning id into new_user_id;

  sample_settings := '{}'::jsonb;
  if owner_phone is not null then
    sample_settings := jsonb_build_object('phone', owner_phone);
  end if;

  insert into public.workspaces (
    name, slug, type, plan, trial_ends_at, city_district, settings
  )
  values (
    clean_name,
    clean_slug,
    'repair',
    'trial',
    now() + interval '15 days',
    clean_city,
    sample_settings
  )
  returning id into new_workspace_id;

  insert into public.memberships (user_id, workspace_id, role, display_name)
  values (
    new_user_id,
    new_workspace_id,
    'owner',
    coalesce(nullif(clean_full_name, ''), clean_name)
  );

  -- Sample intake job so the board is not empty on first login.
  insert into public.customers (workspace_id, full_name, phone)
  values (new_workspace_id, 'Örnek Müşteri', null)
  returning id into sample_customer_id;

  insert into public.vehicles (workspace_id, customer_id, plate_normalized)
  values (new_workspace_id, sample_customer_id, '34ORN001')
  returning id into sample_vehicle_id;

  insert into public.work_orders (
    workspace_id,
    vehicle_id,
    customer_id,
    status,
    complaint,
    created_by_user_id
  )
  values (
    new_workspace_id,
    sample_vehicle_id,
    sample_customer_id,
    'intake',
    'Örnek İş Emri — İnceleyip silebilirsiniz',
    new_user_id
  );

  return new_workspace_id;
end;
$$;

revoke all on function public.register_shop(text, text, text, text, text) from public;
grant execute on function public.register_shop(text, text, text, text, text) to authenticated;
