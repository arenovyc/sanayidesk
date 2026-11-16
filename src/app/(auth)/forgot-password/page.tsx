import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <h1 className="mb-1 text-xl font-semibold">Şifremi unuttum</h1>
      <p className="mb-6 text-sm text-neutral-500">
        E-posta adresine sıfırlama bağlantısı gönderilir.
      </p>
      <ForgotPasswordForm />
    </Card>
  );
}
