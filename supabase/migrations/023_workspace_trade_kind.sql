-- Faz 1: workspace trade_kind + branşa göre örnek iş veya stok.
-- accept_work_order / /today değişmez.

alter table public.workspaces
  add column if not exists trade_kind text not null default 'tamir';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspaces_trade_kind_check'
  ) then
    alter table public.workspaces
      add constraint workspaces_trade_kind_check
      check (
        trade_kind in (
          'tamir',
          'kaporta',
          'elektrik',
          'lastik',
          'parca',
          'torna'
        )
      );
  end if;
end $$;

comment on column public.workspaces.trade_kind is
  'Kayıt branşı: tamir|kaporta|elektrik|lastik|parca|torna';

drop function if exists public.register_shop(text, text, text);
drop function if exists public.register_shop(text, text, text, text, text);

create or replace function public.register_shop(
  _name text,
  _slug text,
  _full_name text default '',
  _owner_phone text default '',
  _city_district text default '',
  _trade_kind text default 'tamir'
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
  clean_trade text := lower(trim(coalesce(_trade_kind, 'tamir')));
  sample_customer_id uuid;
  sample_vehicle_id uuid;
  sample_settings jsonb;
  sample_complaint text;
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

  if clean_trade not in (
    'tamir',
    'kaporta',
    'elektrik',
    'lastik',
    'parca',
    'torna'
  ) then
    raise exception 'invalid_trade_kind';
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
    name, slug, type, plan, trial_ends_at, city_district, settings, trade_kind
  )
  values (
    clean_name,
    clean_slug,
    'repair',
    'trial',
    now() + interval '15 days',
    clean_city,
    sample_settings,
    clean_trade
  )
  returning id into new_workspace_id;

  insert into public.memberships (user_id, workspace_id, role, display_name)
  values (
    new_user_id,
    new_workspace_id,
    'owner',
    coalesce(nullif(clean_full_name, ''), clean_name)
  );

  -- Tezgâh / tedarik: örnek stok, iş emri yok
  if clean_trade in ('parca', 'torna') then
    if clean_trade = 'parca' then
      insert into public.inventory_items (
        workspace_id, sku, name, qty, unit_cost, min_qty
      )
      values
        (new_workspace_id, 'YGF-01', 'Yağ filtresi (örnek)', 12, 180, 3),
        (new_workspace_id, 'FRN-01', 'Fren balata seti (örnek)', 6, 950, 2),
        (new_workspace_id, 'BKM-01', 'Bakım seti 10W40 (örnek)', 4, 2200, 1);
    else
      insert into public.inventory_items (
        workspace_id, sku, name, qty, unit_cost, min_qty
      )
      values
        (new_workspace_id, 'ML-01', 'Mil taşlama (örnek hizmet)', 1, 1500, 0),
        (new_workspace_id, 'YT-01', 'Yatak / bronz (örnek)', 8, 420, 2),
        (new_workspace_id, 'RK-01', 'Rektifiye işi (örnek hizmet)', 1, 3500, 0);
    end if;

    return new_workspace_id;
  end if;

  -- Araç atölyesi: branşa göre örnek intake işi
  sample_complaint := case clean_trade
    when 'kaporta' then
      'Örnek — Ön tampon göçük / boya. İnceleyip silebilirsiniz'
    when 'elektrik' then
      'Örnek — Akü şarj tutmuyor / klima soğutmuyor. İnceleyip silebilirsiniz'
    when 'lastik' then
      'Örnek — 4 lastik değişim + rot-balans. İnceleyip silebilirsiniz'
    else
      'Örnek İş Emri — İnceleyip silebilirsiniz'
  end;

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
    sample_complaint,
    new_user_id
  );

  return new_workspace_id;
end;
$$;

revoke all on function public.register_shop(text, text, text, text, text, text) from public;
grant execute on function public.register_shop(text, text, text, text, text, text) to authenticated;
