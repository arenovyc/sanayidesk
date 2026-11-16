# SanayiDesk

Oto sanayi dükkanları için iş emri, usta PIN, parça, tahsilat, stok ve rapor.

## İlk kurulum

1. `.env.example` → `.env.local`. Doldur:
   - `NEXT_PUBLIC_SITE_URL` — örn. `http://localhost:3000` (OAuth / şifre sıfırlama / Vercel’de prod URL)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **Legacy** `anon` JWT (`eyJ…`)
   - `SUPABASE_SERVICE_ROLE_KEY` — **Legacy** `service_role` (`eyJ…`)
   - `PLATFORM_ADMIN_EMAILS` — virgülle platform admin e-postaları (`/admin`)
   - (İsteğe bağlı) `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `LEADS_NOTIFY_EMAIL` — `/apply` onay maili
2. Şema — **yalnız** CLI:

```bash
npx supabase login
npx supabase link --project-ref <proje-ref>
npm run db:push
```

Migration `001` → `016`. Storage bucket `work-order-media` (004).  
Usta PIN yalnız **kendisine atanan** açık işleri görür (`013`).  
Faz B: `waiting_approval`, tahsilatsız teslim onayı, `remind_at` bakım hatırlatıcı (`014`–`015`).  
Yeni dükkan denemesi **15 gün** (`016`); fiyat vitrini `/fiyat`.  
Ostim demo dükkan: `npm run seed:demo-ostim` → `demo@baskent-oto.local` / `BaskentDemo!2026` · slug `baskent-oto` · PIN `1111`/`2222`/`3333`.

3. Auth → Email: geliştirmede Confirm email kapalı.
4. (İsteğe bağlı) Google OAuth — Providers + `{SITE_URL}/auth/callback`.
   Aynı e-posta + şifre/Google karışması: [`docs/AUTH_GOOGLE_EMAIL.md`](docs/AUTH_GOOGLE_EMAIL.md).
5. `npm install` && `npm run dev`.
6. Dükkanı aç → `/welcome` usta+PIN → usta `/pin`.

### Vercel / canlı

Aynı env’leri proje ayarlarına koy. `NEXT_PUBLIC_SITE_URL` production domain olmalı. Supabase Redirect URLs’e prod `/auth/callback` ekle.

Tam checklist: [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md).

## Rotalar

| Rota | Kim |
|------|-----|
| `/` `/apply` `/privacy` `/terms` | Tanıtım / başvuru / legal |
| `/jobs/[id]/print` | İş emri yazdır / PDF |
| `/register` `/login` `/forgot-password` `/reset-password` | Hesap |
| `/welcome` `/pin` | Onboard / usta |
| `/today` `/board` `/payments` `/more` | Desk |
| `/reports` | Patron rapor + CSV |
| `/inventory` | Stok + dükkanlar arası transfer |
| `/appointments` | Randevu / sıra |
| `/network` | Sanayi ağı (görünür dükkanlar) |
| `/settings` `/settings/account` `/team` | Ayar / hesap / personel |
| `/lift` `/parts` | Usta |
| `/b2b` `/bonuses` `/messages` `/audit` | Cari / prim / paylaşım / audit |
| `/admin` | Platform: plan, askı, deneme |
| `/suspended` | Askıya alınan dükkan |

Smoke A: [`docs/SMOKE_v1.md`](docs/SMOKE_v1.md). Smoke B: [`docs/SMOKE_b.md`](docs/SMOKE_b.md).  
Son otomatik koşu: [`docs/SMOKE_RUN_REPORT.md`](docs/SMOKE_RUN_REPORT.md).

## Smoke (otomasyon)

```bash
node --env-file=.env.local scripts/smoke-bootstrap.mjs   # smoke-a / smoke-b dükkanları
node --env-file=.env.local scripts/smoke-run.mjs         # A kritik + B tam
```

## Test

```bash
npm test
```
