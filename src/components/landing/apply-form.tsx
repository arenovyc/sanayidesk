"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  submitLeadAction,
  type ApplyActionState,
} from "@/app/(public)/apply-actions";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ApplyActionState = { error: null };

export function ApplyForm({ success }: { success: boolean }) {
  const [state, action, pending] = useActionState(submitLeadAction, initial);

  if (success) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
        <Logo variant="mark" tone="light" href={null} />
        <p className="mt-4 text-lg font-semibold text-neutral-950">
          Başvurun alındı
        </p>
        <p className="mt-2 text-neutral-500">
          24 saat içinde e-posta veya telefonla dönüş yapacağız. Acil durum için{" "}
          <a
            href="mailto:destek@sanayidesk.com"
            className="font-medium text-neutral-950 underline-offset-4 hover:underline"
          >
            destek@sanayidesk.com
          </a>
          .
        </p>
        <Link
          href="/"
          className="mt-5 inline-block font-medium text-neutral-950 underline-offset-4 hover:underline"
        >
          Ana sayfa
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="relative grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Ad soyad</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shopName">Dükkan adı</Label>
        <Input id="shopName" name="shopName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">Şehir</Label>
        <Input id="city" name="city" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" type="tel" inputMode="tel" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Not</Label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
        />
      </div>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <Label htmlFor="companyWebsite">Website</Label>
        <Input
          id="companyWebsite"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Gönderiliyor…" : "Başvuruyu gönder"}
      </Button>
    </form>
  );
}
