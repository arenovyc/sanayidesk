# Smoke run report

- **When:** 2026-11-13T11:05:05.908Z  
- **Base URL:** `http://localhost:3000`  
- **Runner:** `node --env-file=.env.local scripts/smoke-run.mjs` (script-first; no browser MCP)  
- **Bootstrap:** `scripts/smoke-bootstrap.mjs` (idempotent)  
- **Shops:** `smoke-a` (`d559dc33-a264-4ce3-a651-442544cb02eb`), `smoke-b` (`172d6602-415c-4ae0-b8c5-1a4a8df5526b`)  
- **Result:** **16 PASS / 0 FAIL / 0 SKIP**  
- **Unit tests:** 64 pass  
- **Build:** green  

## A kritik

| ID | Status | Note |
|----|--------|------|
| A1 | PASS | landing/privacy/terms 200 |
| A2 | PASS | signed in smoke-a@sanayidesk.local |
| A3 | PASS | accept_work_order (after 010 phone fix) |
| A4 | PASS | inventory out on SMOKE-FILTER |
| A5 | PASS | payments select (paid_at) reports data path |
| A6 | PASS | owner_update_shop_profile |
| A7 | PASS | unknown URL → 307; /suspended 200 |

## B tam

| ID | Status | Note |
|----|--------|------|
| B1 | PASS | appointment → convert → job |
| B2 | PASS | network settings share+visible |
| B3 | PASS | shared plate lookup hits=1 |
| B4 | PASS | list_network_shops mine=smoke-a |
| B5 | PASS | B2B party linked to smoke-b |
| B6 | PASS | transfer A→B approved; qty both sides |
| B7 | PASS | suspend + /suspended 200 + temp PLATFORM_ADMIN_EMAILS |
| B8 | PASS | is_suspended restored false |
| B9 | PASS | PLATFORM_ADMIN_EMAILS cleared |

## Bugs found and fixed this run

1. **`accept_work_order` phone ambiguity** — plpgsql var `phone` shadowed `customers.phone` in `ON CONFLICT … WHERE phone IS NOT NULL`. Fixed in [`supabase/migrations/010_fix_accept_phone.sql`](../supabase/migrations/010_fix_accept_phone.sql) (pushed).  
2. **Top bar hydration** — SSR `formatIstanbulDate()` vs client locale. Fixed with client-only [`IstanbulDateLabel`](../src/components/shells/istanbul-date.tsx).  

## Cleanup

- Smoke users **not** deleted (re-runnable).  
- Smoke-A **not** suspended.  
- `.env.local` `PLATFORM_ADMIN_EMAILS=` empty.  

## SKIP (by design)

- Google OAuth, password-reset email, real WhatsApp send, Vercel prod.
