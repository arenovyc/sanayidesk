import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <h1 className="mb-1 text-xl font-semibold">Yeni şifre</h1>
      <p className="mb-6 text-sm text-neutral-500">
        E-postadaki bağlantıdan geldiysen yeni şifreni belirle.
      </p>
      <ResetPasswordForm />
    </Card>
  );
}
