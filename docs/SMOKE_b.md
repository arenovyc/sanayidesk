# SanayiDesk B (network) smoke

`001`–`009` uygulandıktan sonra (`npm run db:push`).

1. Randevu: `/appointments` oluştur → Bugün’de **Sıradaki** → İşe al → iş emri açılır.
2. Ayarlar (owner): Plaka geçmişini paylaş + Ağda görün kaydet.
3. Araç detay: **Diğer dükkanlar** plaka sorgusu (paylaşan başka WS yoksa boş liste OK).
4. `/network`: görünür dükkanlar; kendi dükkan `(benim)`.
5. B2B: taşeron eklerken ağ dükkanı bağla (liste varsa).
6. Stok: transfer iste (hedef ağda görünür) → hedef dükkanda Onayla → iki tarafta hareket.
7. Platform: `PLATFORM_ADMIN_EMAILS` ile `/admin` → plan / askı / deneme tarihi.
8. Askıya alınan dükkan desk’e gidince `/suspended`.
9. `npm test` ve `npm run build` yeşil.

A checklist: [`SMOKE_v1.md`](SMOKE_v1.md).

Otomatik koşu: [`docs/SMOKE_RUN_REPORT.md`](SMOKE_RUN_REPORT.md) (`node --env-file=.env.local scripts/smoke-run.mjs`).

Launch: `/` marketing (desk’e atmaz); `/apply` (011); `/admin` Başvurular. Google/şifre: [`AUTH_GOOGLE_EMAIL.md`](AUTH_GOOGLE_EMAIL.md).
