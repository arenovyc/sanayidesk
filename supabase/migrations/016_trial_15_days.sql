-- Align new shop trial with public offer: 15 days (was 30 in 009)

create or replace function public.register_shop(
  _name text,
  _slug text,
  _full_name text default ''
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

  insert into public.workspaces (name, slug, type, plan, trial_ends_at)
  values (
    clean_name,
    clean_slug,
    'repair',
    'trial',
    now() + interval '15 days'
  )
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

revoke all on function public.register_shop(text, text, text) from public;
grant execute on function public.register_shop(text, text, text) to authenticated;
