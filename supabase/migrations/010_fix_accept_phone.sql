-- Fix accept_work_order: plpgsql variable `phone` shadowed customers.phone
-- in ON CONFLICT ... WHERE phone IS NOT NULL → "column reference phone is ambiguous".

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
  cust_phone text := public.normalize_phone(_phone);
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

  if cust_phone is not null then
    insert into public.customers (workspace_id, full_name, phone)
    values (ws, cust_name, cust_phone)
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
