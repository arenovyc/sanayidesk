"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction, type AuthActionState } from "@/app/(auth)/actions";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyShopName } from "@/lib/format/slug";

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
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {!oauthMode ? (
        <>
          <GoogleAuthButton label="Google ile devam et" />
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-400">veya e-posta</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          Google hesabın bağlı. Dükkan bilgilerini doldur.
          {defaultEmail ? (
            <>
              {" "}
              <span className="font-medium text-neutral-950">{defaultEmail}</span>
            </>
          ) : null}
        </p>
      )}
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Adın</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            defaultValue={defaultFullName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shopName">Dükkan adı</Label>
          <Input
            id="shopName"
            name="shopName"
            required
            value={shopName}
            onChange={(event) => {
              const next = event.target.value;
              setShopName(next);
              if (!slugTouched) setSlug(slugifyShopName(next));
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Dükkan kodu</Label>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value.toLowerCase());
            }}
          />
          <p className="text-xs text-neutral-500">
            Usta PIN girişinde bu kod kullanılacak.
          </p>
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
        ) : null}
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
        <p className="text-center text-sm text-neutral-500">
          Hesabın var mı?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-950 underline-offset-4 hover:underline"
          >
            Giriş
          </Link>
        </p>
      ) : null}
    </div>
  );
}
