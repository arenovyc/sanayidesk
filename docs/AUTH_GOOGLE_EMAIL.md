# Google + e-posta/şifre (aynı e-posta)

Aynı e-posta ile önce şifre, sonra Google (veya tersi) kullanırsan Supabase’te **iki ayrı auth kullanıcısı** oluşabilir. Şifre doğru olsa bile “yanlış” görünür çünkü şifre denediğin kullanıcı, dükkanı açtığın kullanıcı değildir.

Login sayfasında kalıcı uyarı yok. Şifre girişi başarısız olursa sunucu, e-postanın Google kimliği varsa kısaca “Google ile giriş yap” der.

## Operasyon

1. Supabase Dashboard → **Authentication → Users** → e-postayı ara (kaç satır?).
2. Dükkanı Google ile açtıysan uygulamada **Google ile devam et**.
3. Sadece şifre istiyorsan: **Şifremi unuttum** (o auth kullanıcısına bağlanır).
4. `public.users.auth_user_id` ile Dashboard Users satırını eşleştir.
5. Identity link bu sürümde otomatik değil; bir yöntem seç.
