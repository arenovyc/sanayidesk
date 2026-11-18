# Self-serve + canlı smoke (Facebook öncesi)

Son koşu: **2026-11-18T17:22Z** (agent). Canlı: `https://sanayidesk.vercel.app`

## Otomatik

| Adım | Sonuç |
|------|--------|
| `npm test` | **82/82 PASS** |
| `npm run build` | Son push’larda yeşil |
| `NEXT_PUBLIC_SITE_URL=https://sanayidesk.vercel.app node --env-file=.env.local scripts/smoke-run.mjs` | **A1–A7, B1–B9 = 16/16 PASS** (canlı BASE) |

Canlı HTTP (curl):

| Rota | Beklenen | Sonuç |
|------|----------|--------|
| `/` | 200, CTA’lar | PASS |
| `/register/fresh` → `/register` | form | PASS |
| `/demo` → `/today` (Başkent) | DEMO env | PASS |
| `/pin` | usta girişi | PASS |
| `/suspended` | 200 | PASS |
| `/fiyat` `/login` | 200 | PASS |
| `/admin` (oturumsuz) | login’e 307 | PASS |

## Manuel / tarayıcı (agent)

1. Ana sayfa: **15 Gün Ücretsiz Kullan** + **Canlı Demoyu Gör** yan yana; Giriş menüde.
2. `/register/fresh`: boş form (önceki demo oturumu temizlenir).
3. Yeni dükkan kaydı → `/today?shopCode=…` + sarı banner + örnek **34 ORN 001** (bilinçli).
4. `/demo` → Başkent tahta dolu.
5. `/board` → Kabul / Onay / İçeride / Parça / Hazır sütunları.
6. `/pin` → dükkan kodu + PIN tuşları.

## Bilinçli “şok” değil bug

Yeni dükkan ilk ekranı **Bugün**’dür. Sarı kutu dükkan kodunu gösterir; **34 ORN 001** örnek iştir (silinebilir). Bugün özetinde “İçeride” kovası kabul + onay + içeride işleri birlikte sayar — kart rozeti yine **Kabul** yazar.

## Sanayi Sürümü (manuel matris)

| Branş | Beklenen `/today` |
|-------|-------------------|
| tamir/kaporta/elektrik/lastik | Atölye + plaka + hızlı etiket |
| parca | Tezgâh çıkış + stok özeti; banner’da 34 ORN yok |
| torna | Tezgâh + Geldi/İşlemde/Hazır |
| Hepsi | Alt menüde **Komşular**; rehber WA + gölge cari |

Migration: `024_counter_and_neighbors.sql` (canlı SQL Editor). `accept_work_order` A3 aynı.

## Sonraki

- Playwright: 6 branş × kayıt × kabuk assert.
- Smoke HTTP’yi SITE_URL canlıysa otomatik A7’ye bağla.
