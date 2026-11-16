-- =============================================================================
-- SanayiDesk — Ostim Demo Dükkan (Başkent Oto Mekanik)
-- =============================================================================
-- Kanonik, idempotent seed (auth + tüm veri + PIN):
--
--   node --env-file=.env.local scripts/seed-demo-ostim.mjs
--
-- Bu SQL dosyası:
--   1) Dokümantasyon / hatırlatma
--   2) Acil temizlik (slug bazlı) — sonra mutlaka script’i yeniden çalıştır
--
-- Gerekli migration’lar canlıda olmalı: 014–018 (waiting_approval, remind_at,
-- trial 15 gün, pgcrypto public wrappers).
--
-- Giriş bilgileri (script sonrası):
--   Dükkan Girişi  : demo@baskent-oto.local  /  BaskentDemo!2026
--   Dükkan kodu    : baskent-oto
--   Ahmet Usta PIN : 1111
--   Mehmet Usta PIN: 2222
--   Burak PIN      : 3333
--
-- Demo içeriği (script üretir):
--   • 3 usta/PIN, parçacı rehberi, B2B taşeron + cari
--   • Ağda 2 komşu dükkan + onaylı transfer + paylaşımlı plaka geçmişi
--   • 14 stok kalemi (3’ü kritik altı)
--   • ~25+ teslim iş (aylık tahsilat / prim / 3 veresiye)
--   • 3 bakım hatırlatıcı (Bugün)
--   • Tahtada 6 açık iş (her sütun)
--   • 3 randevu, audit + WhatsApp paylaşım kayıtları
-- =============================================================================

-- İsteğe bağlı acil temizlik (Dashboard SQL Editor):
-- delete from public.workspaces
-- where slug in ('baskent-oto', 'ostim-yildiz-oto', 'sasmaz-teknik');
-- Ardından: node --env-file=.env.local scripts/seed-demo-ostim.mjs

do $$
begin
  raise notice 'Ostim demo: tam seed için scripts/seed-demo-ostim.mjs çalıştırın.';
  raise notice 'Giriş: demo@baskent-oto.local / BaskentDemo!2026 · slug baskent-oto · PIN 1111/2222/3333';
end $$;
