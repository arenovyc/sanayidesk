"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addPinMemberAction, type OpsActionState } from "@/app/(desk)/ops-actions";
import { Logo } from "@/components/brand/logo";
import { CopySlugButton } from "@/components/copy-slug-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: OpsActionState = { error: null };

export function WelcomeWizard({
  shopName,
  slug,
  initialStep,
}: {
  shopName: string;
  slug: string;
  initialStep: 1 | 2 | 3;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [addState, addAction, addPending] = useActionState(addPinMemberAction, initial);

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <Logo variant="full" tone="light" href={null} className="mb-4" />
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Kurulum {step} / 3
      </p>
      <ul className="mt-2 flex gap-2">
        {([1, 2, 3] as const).map((n) => (
          <li
            key={n}
            className={
              n <= step
                ? "h-1.5 flex-1 rounded-full bg-amber-500"
                : "h-1.5 flex-1 rounded-full bg-neutral-200"
            }
          />
        ))}
      </ul>

      {step === 1 ? (
        <div className="mt-3 flex flex-col gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
            Dükkanın hazır
          </h1>
          <p className="text-base font-medium text-neutral-950">{shopName}</p>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <p className="font-mono text-sm tracking-wide text-neutral-950">{slug}</p>
            <CopySlugButton slug={slug} />
          </div>
          <p className="text-sm text-neutral-500">
            Usta PIN girişi için bu dükkan kodunu kullanır. Sonraki adımda ilk
            ustayı ekleyeceksin.
          </p>
          <Button type="button" className="w-full" onClick={() => setStep(2)}>
            Devam — usta ekle
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-3 flex flex-col gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
            İlk ustayı ekle
          </h1>
          <p className="text-sm text-neutral-500">
            Usta telefonda <span className="font-mono text-neutral-800">/pin</span>{" "}
            sayfasından dükkan kodu + PIN ile girer. Kabulcü e-posta ile girer;
            onu sonra Personel’den ekleyebilirsin.
          </p>
          <form action={addAction} className="flex flex-col gap-3">
            <input type="hidden" name="returnTo" value="/welcome?step=3" />
            <input type="hidden" name="role" value="mechanic" />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Usta adı</Label>
              <Input id="displayName" name="displayName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pin">4 haneli PIN</Label>
              <Input
                id="pin"
                name="pin"
                inputMode="numeric"
                placeholder="1234"
                required
                minLength={4}
                maxLength={4}
              />
            </div>
            {addState.error ? (
              <p className="text-sm text-red-700" role="alert">
                {addState.error}
              </p>
            ) : null}
            <Button type="submit" disabled={addPending}>
              {addPending ? "Ekleniyor…" : "Ustayı kaydet"}
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setStep(3)}
          >
            Şimdilik atla
          </Button>
          <button
            type="button"
            className="text-center text-sm text-neutral-500 underline-offset-4 hover:underline"
            onClick={() => setStep(1)}
          >
            Geri
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-3 flex flex-col gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
            Hazırsın
          </h1>
          <p className="text-sm text-neutral-500">
            Bugün ekranından araç kabul edebilirsin. Usta{" "}
            <span className="font-mono text-neutral-800">/pin</span> ile dükkan
            kodu <span className="font-mono text-neutral-800">{slug}</span> ve
            PIN’ini kullanır. Daha fazla personel için Personel sayfasına git.
          </p>
          <Button asChild className="w-full">
            <Link href="/today">Bugün’e git</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/team">Personel’e git</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
