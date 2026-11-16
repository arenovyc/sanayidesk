-- Faz A: optional vehicle make/model + desk intake complete RPC

alter table public.vehicles
  add column if not exists make_model text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicles_make_model_len'
  ) then
    alter table public.vehicles
      add constraint vehicles_make_model_len
      check (make_model is null or char_length(trim(make_model)) between 1 and 80);
  end if;
end $$;

create or replace function public.desk_update_job_intake(
  _work_order_id uuid,
  _full_name text default '',
  _phone text default '',
  _complaint text default '',
  _make_model text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  wo public.work_orders%rowtype;
  cust_phone text := public.normalize_phone(_phone);
  cust_name text := trim(coalesce(_full_name, ''));
  note text := trim(coalesce(_complaint, ''));
  model text := nullif(trim(coalesce(_make_model, '')), '');
  cust_id uuid;
begin
  if actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;

  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  if model is not null and char_length(model) > 80 then
    raise exception 'invalid_make_model';
  end if;

  if cust_phone is not null then
    insert into public.customers (workspace_id, full_name, phone)
    values (wo.workspace_id, cust_name, cust_phone)
    on conflict (workspace_id, phone) where (customers.phone is not null)
    do update set
      full_name = case
        when excluded.full_name <> '' then excluded.full_name
        else public.customers.full_name
      end
    returning id into cust_id;
  elsif cust_name <> '' then
    if wo.customer_id is not null then
      update public.customers
      set full_name = case
        when cust_name <> '' then cust_name
        else full_name
      end
      where id = wo.customer_id
      returning id into cust_id;
    else
      insert into public.customers (workspace_id, full_name)
      values (wo.workspace_id, cust_name)
      returning id into cust_id;
    end if;
  else
    cust_id := wo.customer_id;
  end if;

  update public.vehicles
  set
    make_model = coalesce(model, make_model),
    customer_id = coalesce(cust_id, customer_id)
  where id = wo.vehicle_id;

  update public.work_orders
  set
    complaint = case when note <> '' then note else complaint end,
    customer_id = coalesce(cust_id, customer_id)
  where id = wo.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id,
    actor,
    'work_order.intake_update',
    'work_order',
    wo.id,
    jsonb_build_object(
      'full_name', cust_name,
      'phone', cust_phone,
      'complaint', note,
      'make_model', model
    )
  );

  return wo.id;
end;
$$;

revoke all on function public.desk_update_job_intake(uuid, text, text, text, text) from public;
grant execute on function public.desk_update_job_intake(uuid, text, text, text, text) to authenticated;
