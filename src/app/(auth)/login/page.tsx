import { Suspense } from "react";
import { RedirectIfAuthed } from "@/components/auth/redirect-if-authed";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <h1 className="mb-1 text-xl font-semibold">Giriş</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Dükkan sahibi ve kabulcü e-posta ile girer.
      </p>
      <Suspense>
        <RedirectIfAuthed />
      </Suspense>
      <LoginForm />
    </Card>
  );
}
