import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplyForm } from "@/components/landing/apply-form";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  getAuthUser,
  getSessionContext,
  isPlatformAdminEmail,
} from "@/lib/auth/get-membership";
import { homeForRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Başvuru",
  description: "SanayiDesk deneme veya bilgilendirme başvurusu.",
};

export default function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-neutral-500">
          Yükleniyor…
        </div>
      }
    >
      <ApplyBody searchParams={searchParams} />
    </Suspense>
  );
}

async function ApplyBody({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const query = await searchParams;
  const success = query.ok === "1";
  const [ctx, authUser] = await Promise.all([
    getSessionContext(),
    getAuthUser(),
  ]);
  const panelHref = ctx ? homeForRole(ctx.membership.role) : null;
  const showPlatformAdmin = isPlatformAdminEmail(authUser?.email ?? null);

  return (
    <MarketingShell
      tone="light"
      panelHref={panelHref}
      showPlatformAdmin={showPlatformAdmin}
    >
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        <h1 className="text-xl font-semibold tracking-tight">Başvuru</h1>
        <p className="text-sm text-neutral-500">
          Oto sanayi dükkanınız için deneme veya bilgilendirme — formu doldurun,
          24 saat içinde dönüş yapalım.
        </p>
        <ApplyForm success={success} />
      </main>
    </MarketingShell>
  );
}
