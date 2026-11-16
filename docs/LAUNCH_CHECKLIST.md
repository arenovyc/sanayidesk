# Canlıya çıkış checklist

## 1. Git

- İlk commit (henüz yoksa): tüm kaynak + `docs/` (`.env.local` commit etme).
- Remote (GitHub / Origin) + push.

## 2. Supabase (prod proje)

- Migration `001` → `011`: `npm run db:push` (link’li projede).
- Auth → Providers → Email; prod’da confirm email politikana göre.
- Google OAuth: Client ID/Secret + Redirect URLs:
  - `https://<domain>/auth/callback`
  - lokal için `http://localhost:3000/auth/callback`
- Storage bucket `work-order-media` (004 migration).
- Auth Google + e-posta aynı hesap: [`AUTH_GOOGLE_EMAIL.md`](AUTH_GOOGLE_EMAIL.md).

## 3. Vercel (veya host)

Env (Production + Preview):

| Key | Not |
|-----|-----|
| `NEXT_PUBLIC_SITE_URL` | `https://senin-domainin.com` (trailing slash yok) |
| `NEXT_PUBLIC_SUPABASE_URL` | Projeden |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy `anon` JWT (`eyJ…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy `service_role` (server-only) |
| `PLATFORM_ADMIN_EMAILS` | `/admin` için virgüllü e-postalar |
| `RESEND_API_KEY` | Opsiyonel — başvuru maili |
| `RESEND_FROM_EMAIL` | Opsiyonel — doğrulanmış gönderen |
| `LEADS_NOTIFY_EMAIL` | Opsiyonel — yeni lead bildirimi |

Deploy sonrası:

- `/` landing + Logo + OG
- `/apply` form
- `/login` Google + e-posta
- `/pin` usta
- Smoke: lokal veya staging’de `node --env-file=.env.local scripts/smoke-run.mjs`

## 4. Marka / vitrin

- Favicon: `src/app/icon.svg`
- OG: `src/app/opengraph-image.tsx` (`metadataBase` = `NEXT_PUBLIC_SITE_URL`)
- Wordmark: `public/brand/`, `src/components/brand/logo.tsx`

## 5. Bilinçli olmayanlar (bu sürüm)

e-Fatura, SMS/WhatsApp Business API, kartlı ödeme, labor guide, müşteri self-servis onay portalı.
