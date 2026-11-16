import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NetworkSettingsForm } from "@/components/desk/network-settings-form";
import { SettingsNameForm } from "@/components/desk/settings-form";
import { requireDeskSession } from "@/lib/auth/get-membership";

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsBody />
    </Suspense>
  );
}

async function SettingsBody() {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") redirect("/more");

  const trialLabel = ctx.workspace.trialEndsAt
    ? new Date(ctx.workspace.trialEndsAt).toLocaleDateString("tr-TR", {
        timeZone: "Europe/Istanbul",
      })
    : "—";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Ayarlar</h1>
      <p className="text-sm text-neutral-500">
        <Link
          href="/settings/account"
          className="font-medium text-neutral-950 underline-offset-4 hover:underline"
        >
          Hesap (e-posta, şifre, çıkış)
        </Link>
      </p>
      <dl className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm">
        <div className="flex justify-between py-1.5">
          <dt className="text-neutral-500">Kod</dt>
          <dd className="font-mono">{ctx.workspace.slug}</dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="text-neutral-500">Plan</dt>
          <dd>{ctx.workspace.plan}</dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="text-neutral-500">Deneme bitiş</dt>
          <dd>{trialLabel}</dd>
        </div>
      </dl>
      <SettingsNameForm
        defaultName={ctx.workspace.name}
        defaultPhone={ctx.workspace.settings.phone ?? ""}
        defaultAddress={ctx.workspace.settings.address ?? ""}
      />
      <NetworkSettingsForm
        shareVehicleHistory={Boolean(ctx.workspace.settings.shareVehicleHistory)}
        networkVisible={Boolean(ctx.workspace.settings.networkVisible)}
      />
    </div>
  );
}
