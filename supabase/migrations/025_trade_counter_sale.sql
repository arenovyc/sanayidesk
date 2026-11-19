-- Branş Sürümü: trade_kind değiştir, tezgâh satışı (stok+ödeme), ağda trade_kind

-- ---------------------------------------------------------------------------
-- owner_set_trade_kind
-- ---------------------------------------------------------------------------
create or replace function public.owner_set_trade_kind(_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  clean text := lower(trim(coalesce(_kind, '')));
begin
  if actor is null then
    raise exception 'not_authenticated';
  end if;

  select m.workspace_id into ws
  from public.memberships m
  where m.user_id = actor
    and m.is_active
    and m.role = 'owner'
  order by m.created_at
  limit 1;

  if ws is null then
    raise exception 'not_owner';
  end if;

  if clean not in ('tamir', 'kaporta', 'elektrik', 'lastik', 'parca', 'torna') then
    raise exception 'invalid_trade_kind';
  end if;

  update public.workspaces
  set trade_kind = clean
  where id = ws;
end;
$$;

revoke all on function public.owner_set_trade_kind(text) from public;
grant execute on function public.owner_set_trade_kind(text) to authenticated;

-- ---------------------------------------------------------------------------
-- desk_counter_sale — WO + kalemler + stok düş + opsiyonel ödeme (tek TX)
-- _lines: [{"item_id":"uuid","qty":1,"amount":100}] or [{"description":"...","amount":100}]
-- _pay_method: cash|card|transfer|credit|'' (boş = ödeme yok)
-- ---------------------------------------------------------------------------
create or replace function public.desk_counter_sale(
  _title text,
  _full_name text default '',
  _phone text default '',
  _note text default '',
  _lines jsonb default '[]'::jsonb,
  _pay_method text default '',
  _pay_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  title text := nullif(trim(coalesce(_title, '')), '');
  cust_phone text := public.normalize_phone(_phone);
  cust_name text := trim(coalesce(_full_name, ''));
  note text := trim(coalesce(_note, ''));
  cust_id uuid;
  new_id uuid;
  line jsonb;
  item_id uuid;
  item public.inventory_items%rowtype;
  line_qty numeric;
  line_amount numeric;
  line_desc text;
  pay_method text := lower(trim(coalesce(_pay_method, '')));
  pay_amt numeric;
  total_items numeric := 0;
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

  if title is null or char_length(title) < 2 then
    raise exception 'invalid_counter_title';
  end if;

  if cust_phone is not null then
    insert into public.customers (workspace_id, full_name, phone)
    values (ws, coalesce(nullif(cust_name, ''), title), cust_phone)
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

  insert into public.work_orders (
    workspace_id,
    vehicle_id,
    customer_id,
    status,
    complaint,
    counter_title,
    created_by_user_id
  )
  values (
    ws,
    null,
    cust_id,
    'intake',
    note,
    title,
    actor
  )
  returning id into new_id;

  if _lines is not null and jsonb_typeof(_lines) = 'array' then
    for line in select * from jsonb_array_elements(_lines)
    loop
      line_qty := coalesce((line ->> 'qty')::numeric, 1);
      if line_qty is null or line_qty <= 0 then
        raise exception 'invalid_amount';
      end if;

      line_amount := coalesce((line ->> 'amount')::numeric, 0);
      if line_amount < 0 then
        raise exception 'invalid_amount';
      end if;

      item_id := nullif(line ->> 'item_id', '')::uuid;
      if item_id is not null then
        select * into item from public.inventory_items where id = item_id for update;
        if not found or item.workspace_id <> ws then
          raise exception 'not_found';
        end if;
        if item.qty < line_qty then
          raise exception 'insufficient_stock';
        end if;
        update public.inventory_items
        set qty = qty - line_qty, updated_at = now()
        where id = item.id;

        insert into public.inventory_movements (
          workspace_id, item_id, kind, qty, work_order_id, note, created_by_user_id
        )
        values (
          ws, item.id, 'out', line_qty, new_id, 'Tezgâh satışı', actor
        );

        line_desc := coalesce(nullif(trim(line ->> 'description'), ''), item.name);
        if line_amount <= 0 then
          line_amount := round(item.unit_cost * line_qty, 2);
        end if;
      else
        line_desc := nullif(trim(coalesce(line ->> 'description', '')), '');
        if line_desc is null then
          line_desc := title;
        end if;
      end if;

      if line_amount > 0 then
        insert into public.work_order_items (
          workspace_id, work_order_id, kind, description, amount
        )
        values (ws, new_id, 'part', line_desc, line_amount);
        total_items := total_items + line_amount;
      end if;
    end loop;
  end if;

  if pay_method in ('cash', 'card', 'transfer', 'credit') then
    pay_amt := coalesce(_pay_amount, total_items);
    if pay_amt is null or pay_amt <= 0 then
      raise exception 'invalid_amount';
    end if;
    perform public.desk_add_payment(
      new_id,
      pay_amt,
      pay_method::public.payment_method,
      'uninvoiced',
      case when pay_method = 'credit' then 'Tezgâh veresiye' else 'Tezgâh tahsilat' end
    );
  end if;

  return jsonb_build_object(
    'id', new_id,
    'created', true,
    'total', total_items
  );
end;
$$;

revoke all on function public.desk_counter_sale(text, text, text, text, jsonb, text, numeric) from public;
grant execute on function public.desk_counter_sale(text, text, text, text, jsonb, text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- list_network_shops — trade_kind + city_district
-- ---------------------------------------------------------------------------
create or replace function public.list_network_shops()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  ws uuid;
  payload jsonb;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;

  select m.workspace_id into ws
  from public.memberships m
  where m.user_id = actor and m.is_active
  order by m.created_at
  limit 1;

  if ws is null then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.name), '[]'::jsonb)
  into payload
  from (
    select
      w.id,
      w.name,
      w.slug,
      w.type::text as type,
      coalesce(w.trade_kind, 'tamir') as trade_kind,
      coalesce(w.settings ->> 'phone', '') as phone,
      coalesce(w.settings ->> 'address', '') as address,
      coalesce(w.settings ->> 'city_district', '') as city_district,
      (w.id = ws) as is_mine
    from public.workspaces w
    where coalesce((w.settings ->> 'network_visible')::boolean, false) = true
      and w.is_suspended = false
  ) t;

  return payload;
end;
$$;

revoke all on function public.list_network_shops() from public;
grant execute on function public.list_network_shops() to authenticated;
