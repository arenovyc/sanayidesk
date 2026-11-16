# SanayiDesk v1 smoke checklist

Manuel doğrulama (localhost veya staging).

1. `.env.local` dolu; `npm run db:push` (001–010).
2. `npm run dev` → `/` marketing açılır (otomatik desk’e atmaz); Başvuru / Giriş; Gizlilik / Şartlar.
2b. `/apply` başvuru formu (011 sonrası); admin’de Başvurular.
3. Dükkanı aç (e-posta) → `/welcome` 3 adım → usta + PIN.
4. Google ile giriş (provider açıksa) → membership yoksa `/register`.
5. Şifremi unuttum → mail → yeni şifre.
6. `/settings/account` e-posta görünür; şifre değiştir (e-posta hesabı).
7. Personel: usta PIN + kabulcü (service role ile).
8. `/pin` usta girişi → `/lift`.
9. Desk: plaka kabul → tahta (4 sütun, sürükle).
10. Usta atama; yük dağılımı.
11. İş detay: kalem, tahsilat, foto.
12. Hazır durum + müşteri telefonu → WhatsApp “araç hazır”.
13. Teklif tutarı kaydet.
14. Stok: kart ekle, hareket, işten stok düş.
15. Çan: düşük stok / hazır / atanmamış.
16. Owner: `/reports` tarih + CSV indir.
17. Ayarlar: telefon / adres kaydet.
18. B2B taşeron kayıt (şema varsa).
19. Prim (owner).
20. Audit (desk).
21. Olmayan URL → Türkçe 404.
22. Kabulcü Daha fazla’da Ayarlar / Prim / Raporlar yok; Stok var.
23. Üst bardan çıkış.
24. `npm test` ve `npm run build` yeşil.

Vercel: `NEXT_PUBLIC_SITE_URL`, Supabase URL + legacy anon + service_role; OAuth redirect prod URL.

Otomatik koşu: [`docs/SMOKE_RUN_REPORT.md`](SMOKE_RUN_REPORT.md) (`node --env-file=.env.local scripts/smoke-run.mjs`).
