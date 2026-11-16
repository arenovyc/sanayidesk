-- SanayiDesk MEGA 3: B2B party balances view + staff open jobs display_no.

-- ---------------------------------------------------------------------------
-- b2b_party_balances (confirmed only; net = we_owe - they_owe)
-- ---------------------------------------------------------------------------
create or replace view public.b2b_party_balances
with (security_invoker = true)
as
select
  p.workspace_id,
  p.id as party_id,
  p.name as party_name,
  coalesce(sum(e.amount) filter (where e.status = 'confirmed' and e.direction = 'we_owe'), 0)
    ::numeric(12, 2) as we_owe_total,
  coalesce(sum(e.amount) filter (where e.status = 'confirmed' and e.direction = 'they_owe'), 0)
    ::numeric(12, 2) as they_owe_total,
  (
    coalesce(sum(e.amount) filter (where e.status = 'confirmed' and e.direction = 'we_owe'), 0)
    - coalesce(sum(e.amount) filter (where e.status = 'confirmed' and e.direction = 'they_owe'), 0)
  )::numeric(12, 2) as net
from public.external_parties p
left join public.b2b_ledger_entries e
  on e.external_party_id = p.id
 and e.workspace_id = p.workspace_id
group by p.workspace_id, p.id, p.name;

grant select on public.b2b_party_balances to authenticated;

-- ---------------------------------------------------------------------------
-- staff_list_open_jobs: include display_no
-- ---------------------------------------------------------------------------
create or replace function public.staff_list_open_jobs(_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  mem public.memberships%rowtype;
begin
  mem := public.staff_membership_from_token(_token);
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', wo.id,
        'status', wo.status,
        'complaint', wo.complaint,
        'plate', v.plate_normalized,
        'display_no', wo.display_no
      )
      order by wo.opened_at desc
    )
    from public.work_orders wo
    join public.vehicles v on v.id = wo.vehicle_id
    where wo.workspace_id = mem.workspace_id
      and wo.status in ('intake', 'in_progress', 'waiting_parts', 'ready')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.staff_list_open_jobs(text) from public;
grant execute on function public.staff_list_open_jobs(text) to anon, authenticated;
