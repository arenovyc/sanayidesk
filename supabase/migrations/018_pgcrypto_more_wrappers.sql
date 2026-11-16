-- Additional pgcrypto wrappers for pin session token generation

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

revoke all on function public.gen_random_bytes(integer) from public;
revoke all on function public.digest(text, text) from public;
revoke all on function public.digest(bytea, text) from public;
grant execute on function public.gen_random_bytes(integer) to anon, authenticated, service_role;
grant execute on function public.digest(text, text) to anon, authenticated, service_role;
grant execute on function public.digest(bytea, text) to anon, authenticated, service_role;
