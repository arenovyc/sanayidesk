"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/app/(auth)/actions";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthActionState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <div className="flex flex-col gap-4">
      <GoogleAuthButton label="Google ile devam et" />
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">veya e-posta</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Şifre</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-500 underline-offset-4 hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-4 rounded border-neutral-300 accent-neutral-950"
          />
          Beni hatırla
        </label>
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="min-h-12 rounded-xl" disabled={pending}>
          {pending ? "Giriş…" : "Giriş"}
        </Button>
      </form>
      <p className="text-center text-sm text-neutral-500">
        Dükkanın yok mu?{" "}
        <Link
          href="/register"
          className="font-medium text-neutral-950 underline-offset-4 hover:underline"
        >
          Dükkanı aç
        </Link>
      </p>
      <p className="text-center text-sm text-neutral-600">
        <Link
          href="/pin"
          className="font-medium underline-offset-4 hover:underline"
        >
          Usta girişi
        </Link>
      </p>
    </div>
  );
}
