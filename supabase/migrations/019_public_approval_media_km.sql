-- Faz 1: public approval token, media tags, entry_km, approval question bell

alter table public.work_orders
  add column if not exists public_token uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists approval_ip text,
  add column if not exists customer_approval_note text,
  add column if not exists approval_question_at timestamptz,
  add column if not exists entry_km int,
  add column if not exists next_service_km int;

create unique index if not exists work_orders_public_token_uidx
  on public.work_orders (public_token)
  where public_token is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'work_orders_entry_km_nonneg'
  ) then
    alter table public.work_orders
      add constraint work_orders_entry_km_nonneg
      check (entry_km is null or entry_km >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'work_orders_next_service_km_nonneg'
  ) then
    alter table public.work_orders
      add constraint work_orders_next_service_km_nonneg
      check (next_service_km is null or next_service_km >= 0);
  end if;
end $$;

alter table public.media
  add column if not exists tag text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_tag_allowed'
  ) then
    alter table public.media
      add constraint media_tag_allowed
      check (
        tag is null
        or tag in ('entry_damage', 'old_part', 'new_part')
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- desk_ensure_approval_token
-- ---------------------------------------------------------------------------
create or replace function public.desk_ensure_approval_token(_work_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  token uuid;
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  if wo.public_token is not null then
    return wo.public_token;
  end if;

  token := gen_random_uuid();
  update public.work_orders
  set public_token = token
  where id = wo.id
    and public_token is null
  returning public_token into token;

  if token is null then
    select public_token into token from public.work_orders where id = wo.id;
  end if;

  return token;
end;
$$;

revoke all on function public.desk_ensure_approval_token(uuid) from public;
grant execute on function public.desk_ensure_approval_token(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- public_get_approval
-- ---------------------------------------------------------------------------
create or replace function public.public_get_approval(_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  ws public.workspaces%rowtype;
  v public.vehicles%rowtype;
  totals record;
  items jsonb;
  media_rows jsonb;
begin
  if _token is null then
    raise exception 'not_found';
  end if;

  select * into wo from public.work_orders where public_token = _token;
  if not found then
    raise exception 'not_found';
  end if;

  select * into ws from public.workspaces where id = wo.workspace_id;
  select * into v from public.vehicles where id = wo.vehicle_id;
  select * into totals from public.work_order_totals(wo.id);

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'kind', i.kind,
      'description', i.description,
      'amount', i.amount
    )
    order by i.created_at
  ), '[]'::jsonb)
  into items
  from public.work_order_items i
  where i.work_order_id = wo.id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'storage_path', m.storage_path,
      'tag', m.tag,
      'content_type', m.content_type
    )
    order by m.created_at desc
  ), '[]'::jsonb)
  into media_rows
  from public.media m
  where m.work_order_id = wo.id
    and m.tag in ('entry_damage', 'old_part');

  return jsonb_build_object(
    'work_order_id', wo.id,
    'status', wo.status,
    'shop_name', ws.name,
    'shop_phone', ws.settings->>'phone',
    'plate', v.plate_normalized,
    'make_model', v.make_model,
    'entry_km', wo.entry_km,
    'display_no', wo.display_no,
    'complaint', wo.complaint,
    'due', coalesce(totals.due, 0),
    'items', items,
    'media', media_rows,
    'approved_at', wo.approved_at,
    'has_question', wo.approval_question_at is not null,
    'customer_approval_note', wo.customer_approval_note,
    'vehicle_checkup', coalesce(wo.vehicle_checkup, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.public_get_approval(uuid) from public;
grant execute on function public.public_get_approval(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- public_approve_quote
-- ---------------------------------------------------------------------------
create or replace function public.public_approve_quote(_token uuid, _ip text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  ip text := left(trim(coalesce(_ip, '')), 64);
begin
  if _token is null then
    raise exception 'not_found';
  end if;

  select * into wo from public.work_orders where public_token = _token for update;
  if not found then
    raise exception 'not_found';
  end if;

  if wo.approved_at is not null then
    return jsonb_build_object('ok', true, 'already', true, 'status', wo.status);
  end if;

  if wo.status is distinct from 'waiting_approval' then
    raise exception 'invalid_status';
  end if;

  if not public.work_order_can_transition(wo.status, 'in_progress') then
    raise exception 'invalid_transition';
  end if;

  update public.work_orders
  set
    status = 'in_progress',
    approved_at = now(),
    approval_ip = nullif(ip, ''),
    approval_question_at = null
  where id = wo.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id,
    null,
    'work_order.customer_approve',
    'work_order',
    wo.id,
    jsonb_build_object(
      'via', 'public_link',
      'ip', nullif(ip, ''),
      'from_status', 'waiting_approval',
      'to_status', 'in_progress'
    )
  );

  return jsonb_build_object('ok', true, 'already', false, 'status', 'in_progress');
end;
$$;

revoke all on function public.public_approve_quote(uuid, text) from public;
grant execute on function public.public_approve_quote(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- public_ask_about_quote
-- ---------------------------------------------------------------------------
create or replace function public.public_ask_about_quote(
  _token uuid,
  _note text,
  _ip text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
  note text := left(trim(coalesce(_note, '')), 500);
  ip text := left(trim(coalesce(_ip, '')), 64);
begin
  if _token is null then
    raise exception 'not_found';
  end if;
  if note = '' or char_length(note) < 2 then
    raise exception 'invalid_note';
  end if;

  select * into wo from public.work_orders where public_token = _token for update;
  if not found then
    raise exception 'not_found';
  end if;

  if wo.status in ('delivered', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  update public.work_orders
  set
    customer_approval_note = note,
    approval_question_at = now(),
    approval_ip = coalesce(nullif(ip, ''), approval_ip)
  where id = wo.id;

  insert into public.audit_logs (
    workspace_id, actor_user_id, action, entity_type, entity_id, new_data
  )
  values (
    wo.workspace_id,
    null,
    'work_order.customer_question',
    'work_order',
    wo.id,
    jsonb_build_object('note', note, 'ip', nullif(ip, ''))
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.public_ask_about_quote(uuid, text, text) from public;
grant execute on function public.public_ask_about_quote(uuid, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- desk_clear_approval_question
-- ---------------------------------------------------------------------------
create or replace function public.desk_clear_approval_question(_work_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wo public.work_orders%rowtype;
begin
  select * into wo from public.work_orders where id = _work_order_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_desk_member(wo.workspace_id) then
    raise exception 'not_desk';
  end if;

  update public.work_orders
  set approval_question_at = null
  where id = wo.id;

  return wo.id;
end;
$$;

revoke all on function public.desk_clear_approval_question(uuid) from public;
grant execute on function public.desk_clear_approval_question(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- desk_update_job_intake + entry_km
-- ---------------------------------------------------------------------------
drop function if exists public.desk_update_job_intake(uuid, text, text, text, text);

create or replace function public.desk_update_job_intake(
  _work_order_id uuid,
  _full_name text default '',
  _phone text default '',
  _complaint text default '',
  _make_model text default '',
  _entry_km int default null
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

  if _entry_km is not null and _entry_km < 0 then
    raise exception 'invalid_entry_km';
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
    customer_id = coalesce(cust_id, customer_id),
    entry_km = coalesce(_entry_km, entry_km)
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
      'make_model', model,
      'entry_km', _entry_km
    )
  );

  return wo.id;
end;
$$;

revoke all on function public.desk_update_job_intake(uuid, text, text, text, text, int) from public;
grant execute on function public.desk_update_job_intake(uuid, text, text, text, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- set_work_order_status: next_service_km on deliver+remind
-- ---------------------------------------------------------------------------
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

  return _id;
end;
$$;

revoke all on function public.set_work_order_status(
  uuid, public.work_order_status, boolean, boolean
) from public;
grant execute on function public.set_work_order_status(
  uuid, public.work_order_status, boolean, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- staff_register_media + tag
-- ---------------------------------------------------------------------------
drop function if exists public.staff_register_media(text, uuid, text, text, int);

create or replace function public.staff_register_media(
  _token text,
  _work_order_id uuid,
  _storage_path text,
  _content_type text default 'image/jpeg',
  _byte_size int default 0,
  _tag text default null
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
  clean_tag text := nullif(trim(coalesce(_tag, '')), '');
begin
  mem := public.staff_membership_from_token(_token);
  select * into wo from public.work_orders where id = _work_order_id;
  if not found or wo.workspace_id <> mem.workspace_id then
    raise exception 'not_found';
  end if;
  if path = '' or char_length(path) < 8 then
    raise exception 'invalid_path';
  end if;
  if clean_tag is not null
     and clean_tag not in ('entry_damage', 'old_part', 'new_part') then
    raise exception 'invalid_tag';
  end if;

  insert into public.media (
    workspace_id, work_order_id, storage_path, content_type, byte_size,
    created_by_membership_id, tag
  )
  values (
    mem.workspace_id, wo.id, path, coalesce(nullif(trim(_content_type), ''), 'image/jpeg'),
    greatest(coalesce(_byte_size, 0), 0), mem.id, clean_tag
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.staff_register_media(text, uuid, text, text, int, text) from public;
grant execute on function public.staff_register_media(text, uuid, text, text, int, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- notification view + approval_questions
-- (vehicle_checkup column added in 020; coalesce handles missing until then)
-- ---------------------------------------------------------------------------
-- Add vehicle_checkup early so public_get_approval and view stay valid
alter table public.work_orders
  add column if not exists vehicle_checkup jsonb not null default '{}'::jsonb;

create or replace view public.desk_notification_counts
with (security_invoker = true)
as
select
  w.id as workspace_id,
  (
    select count(*)::int
    from public.b2b_ledger_entries e
    where e.workspace_id = w.id
      and e.status = 'pending'
  ) as b2b_pending,
  (
    select count(*)::int
    from public.work_orders wo
    where wo.workspace_id = w.id
      and wo.status in (
        'intake',
        'waiting_approval',
        'in_progress',
        'waiting_parts',
        'ready'
      )
      and not exists (
        select 1
        from public.work_order_assignments a
        where a.work_order_id = wo.id
          and a.unassigned_at is null
      )
  ) as unassigned,
  (
    select count(*)::int
    from public.work_orders wo
    where wo.workspace_id = w.id
      and wo.status = 'ready'
  ) as ready,
  (
    select count(*)::int
    from public.inventory_items i
    where i.workspace_id = w.id
      and i.qty <= i.min_qty
  ) as low_stock,
  (
    select count(*)::int
    from public.work_orders wo
    where wo.workspace_id = w.id
      and wo.approval_question_at is not null
      and wo.status in (
        'intake',
        'waiting_approval',
        'in_progress',
        'waiting_parts',
        'ready'
      )
  ) as approval_questions
from public.workspaces w;

grant select on public.desk_notification_counts to authenticated;
