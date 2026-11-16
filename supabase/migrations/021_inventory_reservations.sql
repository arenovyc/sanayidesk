-- Faz 3: inventory reserve/release without changing shelf qty until settle

alter table public.inventory_movements
  drop constraint if exists inventory_movements_kind;

alter table public.inventory_movements
  add constraint inventory_movements_kind
  check (kind in ('in', 'out', 'adjust', 'reserve', 'release'));

create or replace function public.inventory_reserved_qty(_item_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
    case
      when m.kind = 'reserve' then m.qty
      when m.kind = 'release' then -m.qty
      else 0
    end
  ), 0)
  from public.inventory_movements m
  join public.work_orders wo on wo.id = m.work_order_id
  where m.item_id = _item_id
    and m.work_order_id is not null
    and wo.status in (
      'intake',
      'waiting_approval',
      'in_progress',
      'waiting_parts',
      'ready'
    );
$$;

revoke all on function public.inventory_reserved_qty(uuid) from public;
grant execute on function public.inventory_reserved_qty(uuid) to authenticated;

create or replace function public.desk_inventory_move(
  _item_id uuid,
  _kind text,
  _qty numeric,
  _work_order_id uuid default null,
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
  wo public.work_orders%rowtype;
  move_id uuid;
  next_qty numeric;
  reserved numeric;
  available numeric;
  effective_kind text := _kind;
begin
  select * into item from public.inventory_items where id = _item_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(item.workspace_id) then
    raise exception 'forbidden';
  end if;
  if _kind not in ('in', 'out', 'adjust', 'reserve', 'release') then
    raise exception 'invalid_kind';
  end if;
  if _qty is null or _qty <= 0 then
    raise exception 'invalid_amount';
  end if;

  if _work_order_id is not null then
    select * into wo from public.work_orders where id = _work_order_id;
    if not found or wo.workspace_id <> item.workspace_id then
      raise exception 'not_found';
    end if;
    -- Job "stoktan düş" on open WO → reserve shelf stock
    if _kind = 'out' and wo.status in (
      'intake', 'waiting_approval', 'in_progress', 'waiting_parts', 'ready'
    ) then
      effective_kind := 'reserve';
    end if;
  end if;

  reserved := public.inventory_reserved_qty(item.id);
  available := item.qty - reserved;

  if effective_kind = 'in' then
    next_qty := item.qty + _qty;
  elsif effective_kind = 'out' then
    if available < _qty then
      raise exception 'insufficient_stock';
    end if;
    next_qty := item.qty - _qty;
  elsif effective_kind = 'reserve' then
    if available < _qty then
      raise exception 'insufficient_stock';
    end if;
    next_qty := item.qty; -- shelf qty unchanged
  elsif effective_kind = 'release' then
    next_qty := item.qty;
  else
    next_qty := _qty;
  end if;

  if effective_kind = 'adjust' and next_qty = item.qty then
    update public.inventory_items set updated_at = now() where id = item.id;
    return item.id;
  end if;

  if effective_kind in ('in', 'out', 'adjust') then
    update public.inventory_items
    set qty = next_qty, updated_at = now()
    where id = item.id;
  else
    update public.inventory_items
    set updated_at = now()
    where id = item.id;
  end if;

  insert into public.inventory_movements (
    workspace_id, item_id, kind, qty, work_order_id, note, created_by_user_id
  )
  values (
    item.workspace_id,
    item.id,
    effective_kind,
    case
      when effective_kind = 'adjust' then abs(next_qty - item.qty)
      else _qty
    end,
    _work_order_id,
    coalesce(_note, ''),
    actor
  )
  returning id into move_id;

  return move_id;
end;
$$;

revoke all on function public.desk_inventory_move(uuid, text, numeric, uuid, text) from public;
grant execute on function public.desk_inventory_move(uuid, text, numeric, uuid, text) to authenticated;

-- On deliver/cancel: convert open reserves for this WO into out (or release on cancel)
create or replace function public.desk_settle_inventory_reservations(
  _work_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  rec record;
  actor uuid := public.current_app_user_id();
  reserved_net numeric;
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'forbidden';
  end if;

  for rec in
    select m.item_id, sum(
      case when m.kind = 'reserve' then m.qty when m.kind = 'release' then -m.qty else 0 end
    ) as net
    from public.inventory_movements m
    where m.work_order_id = wo.id
      and m.kind in ('reserve', 'release')
    group by m.item_id
    having sum(
      case when m.kind = 'reserve' then m.qty when m.kind = 'release' then -m.qty else 0 end
    ) > 0
  loop
    reserved_net := rec.net;
    if wo.status = 'delivered' then
      update public.inventory_items
      set qty = qty - reserved_net, updated_at = now()
      where id = rec.item_id
        and qty >= reserved_net;
      if not found then
        raise exception 'insufficient_stock';
      end if;
      insert into public.inventory_movements (
        workspace_id, item_id, kind, qty, work_order_id, note, created_by_user_id
      )
      values (
        wo.workspace_id, rec.item_id, 'out', reserved_net, wo.id,
        'Rezerv → tüketim (teslim)', actor
      );
      insert into public.inventory_movements (
        workspace_id, item_id, kind, qty, work_order_id, note, created_by_user_id
      )
      values (
        wo.workspace_id, rec.item_id, 'release', reserved_net, wo.id,
        'Rezerv kapatıldı (teslim)', actor
      );
    elsif wo.status = 'cancelled' then
      insert into public.inventory_movements (
        workspace_id, item_id, kind, qty, work_order_id, note, created_by_user_id
      )
      values (
        wo.workspace_id, rec.item_id, 'release', reserved_net, wo.id,
        'Rezerv serbest (iptal)', actor
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.desk_settle_inventory_reservations(uuid) from public;
grant execute on function public.desk_settle_inventory_reservations(uuid) to authenticated;

-- Hook settle into set_work_order_status when closing
create or replace function public.set_work_order_status(
  _id uuid,
  _status public.work_order_status,
  _allow_unpaid boolean default false,
  _set_remind boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  totals record;
  remaining numeric(12, 2);
  actor uuid := public.current_app_user_id();
  next_km int;
begin
  select * into wo from public.work_orders where id = _id;
  if not found then
    raise exception 'not_found';
  end if;

  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  if not public.work_order_can_transition(wo.status, _status) then
    raise exception 'invalid_transition';
  end if;

  if _status in ('ready', 'delivered') then
    select * into totals from public.work_order_totals(wo.id);
    remaining := coalesce(totals.due, 0) - coalesce(totals.paid, 0);
    if remaining > 0 and not coalesce(_allow_unpaid, false) then
      raise exception 'unpaid_balance';
    end if;
    if remaining > 0 and coalesce(_allow_unpaid, false) then
      insert into public.audit_logs (
        workspace_id, actor_user_id, action, entity_type, entity_id, new_data
      )
      values (
        wo.workspace_id,
        actor,
        'work_order.deliver_unpaid',
        'work_order',
        wo.id,
        jsonb_build_object(
          'remaining', remaining,
          'to_status', _status::text,
          'from_status', wo.status::text
        )
      );
    end if;
  end if;

  next_km := case
    when _status = 'delivered'
      and coalesce(_set_remind, false)
      and wo.entry_km is not null
    then wo.entry_km + 10000
    else wo.next_service_km
  end;

  update public.work_orders
  set
    status = _status,
    remind_at = case
      when _status = 'delivered' and coalesce(_set_remind, false) then now() + interval '10 months'
      else remind_at
    end,
    next_service_km = next_km
  where id = _id;

  if _status in ('delivered', 'cancelled') then
    perform public.desk_settle_inventory_reservations(_id);
  end if;

  return _id;
end;
$$;

revoke all on function public.set_work_order_status(
  uuid, public.work_order_status, boolean, boolean
) from public;
grant execute on function public.set_work_order_status(
  uuid, public.work_order_status, boolean, boolean
) to authenticated;
