-- Faz 2: vehicle checkup RPC (column may already exist from 019)

alter table public.work_orders
  add column if not exists vehicle_checkup jsonb not null default '{}'::jsonb;

create or replace function public.desk_set_vehicle_checkup(
  _work_order_id uuid,
  _checkup jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  actor uuid := public.current_app_user_id();
  clean jsonb := '{}'::jsonb;
  key text;
  val text;
  allowed_keys text[] := array[
    'brake_pads', 'tires', 'battery', 'wipers', 'fluids', 'belts'
  ];
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  if _checkup is null or jsonb_typeof(_checkup) <> 'object' then
    raise exception 'invalid_checkup';
  end if;

  for key in select jsonb_object_keys(_checkup)
  loop
    if key = any (allowed_keys) then
      val := _checkup ->> key;
      if val in ('ok', 'soon', 'urgent') then
        clean := clean || jsonb_build_object(key, val);
      end if;
    end if;
  end loop;

  update public.work_orders
  set vehicle_checkup = clean
  where id = wo.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id,
    actor,
    'work_order.checkup',
    'work_order',
    wo.id,
    clean
  );

  return wo.id;
end;
$$;

revoke all on function public.desk_set_vehicle_checkup(uuid, jsonb) from public;
grant execute on function public.desk_set_vehicle_checkup(uuid, jsonb) to authenticated;
