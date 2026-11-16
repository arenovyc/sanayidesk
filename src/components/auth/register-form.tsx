"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthActionState } from "@/app/(auth)/actions";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthActionState = { error: null };

export function RegisterForm({
  defaultEmail = "",
  defaultFullName = "",
  oauthMode = false,
}: {
  defaultEmail?: string;
  defaultFullName?: string;
  oauthMode?: boolean;
}) {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        2 dakikada dükkanın hazır — kart yok, kurulum yok.
      </p>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shopName">Dükkan adı</Label>
          <Input
            id="shopName"
            name="shopName"
            required
            autoComplete="organization"
            placeholder="Öztürk Oto"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cityDistrict">İl / İlçe</Label>
          <Input
            id="cityDistrict"
            name="cityDistrict"
            required
            placeholder="Ankara / Ostim"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Yetkili adı soyadı</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            defaultValue={defaultFullName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Cep telefonu (WhatsApp)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="05xx xxx xx xx"
          />
        </div>
        {!oauthMode ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={defaultEmail}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
            Google hesabın bağlı.
            {defaultEmail ? (
              <>
                {" "}
                <span className="font-medium text-neutral-950">{defaultEmail}</span>
              </>
            ) : null}
          </p>
        )}
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Açılıyor…" : "Dükkanı aç"}
        </Button>
      </form>

      {!oauthMode ? (
        <>
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-400">veya Google</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
          <GoogleAuthButton label="Google ile devam et" />
          <p className="text-center text-sm text-neutral-500">
            Hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-medium text-neutral-950 underline-offset-4 hover:underline"
            >
              Giriş
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
