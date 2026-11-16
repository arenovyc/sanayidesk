-- Supabase hosts pgcrypto in schema "extensions"; pin RPCs use search_path=public.
-- Expose crypt/gen_salt in public so existing pin_login / owner_set_member_pin work.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.crypt(password text, salt text)
returns text
language sql
immutable
parallel safe
as $$
  select extensions.crypt(password, salt)
$$;

create or replace function public.gen_salt(type text)
returns text
language sql
volatile
parallel safe
as $$
  select extensions.gen_salt(type)
$$;

create or replace function public.gen_salt(type text, iter_count integer)
returns text
language sql
volatile
parallel safe
as $$
  select extensions.gen_salt(type, iter_count)
$$;

create or replace function public.gen_random_bytes(count integer)
returns bytea
language sql
volatile
parallel safe
as $$
  select extensions.gen_random_bytes(count)
$$;

create or replace function public.digest(data text, type text)
returns bytea
language sql
immutable
parallel safe
as $$
  select extensions.digest(data, type)
$$;

create or replace function public.digest(data bytea, type text)
returns bytea
language sql
immutable
parallel safe
as $$
  select extensions.digest(data, type)
$$;

revoke all on function public.crypt(text, text) from public;
revoke all on function public.gen_salt(text) from public;
revoke all on function public.gen_salt(text, integer) from public;
revoke all on function public.gen_random_bytes(integer) from public;
revoke all on function public.digest(text, text) from public;
revoke all on function public.digest(bytea, text) from public;
grant execute on function public.crypt(text, text) to anon, authenticated, service_role;
grant execute on function public.gen_salt(text) to anon, authenticated, service_role;
grant execute on function public.gen_salt(text, integer) to anon, authenticated, service_role;
grant execute on function public.gen_random_bytes(integer) to anon, authenticated, service_role;
grant execute on function public.digest(text, text) to anon, authenticated, service_role;
grant execute on function public.digest(bytea, text) to anon, authenticated, service_role;
