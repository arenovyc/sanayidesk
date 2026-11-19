import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getAuthUser, getSessionContext } from "@/lib/auth/get-membership";
import { homeForRole } from "@/lib/auth/roles";
import { TRIAL_DAYS } from "@/lib/pricing";
import { isTradeKind, type TradeKind } from "@/lib/trade/kinds";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RegisterBody searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterBody({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string }>;
}) {
  const ctx = await getSessionContext();
  if (ctx) redirect(homeForRole(ctx.membership.role));

  const query = await searchParams;
  const defaultTradeKind: TradeKind =
    query.tur && isTradeKind(query.tur) ? query.tur : "tamir";

  const authUser = await getAuthUser();
  const oauthMode = Boolean(authUser);
  const defaultEmail = authUser?.email ?? "";
  const defaultFullName =
    typeof authUser?.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : typeof authUser?.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : "";

  return (
    <Card className="w-full max-w-md">
      <h1 className="mb-1 text-xl font-semibold">Dükkanı aç</h1>
      <p className="mb-6 text-sm text-neutral-500">
        {oauthMode
          ? `Hesabın hazır. ${TRIAL_DAYS} gün ücretsiz deneme ile dükkanını oluştur.`
          : `${TRIAL_DAYS} gün ücretsiz · kart yok · 2 dakikada başla.`}
      </p>
      <RegisterForm
        oauthMode={oauthMode}
        defaultEmail={defaultEmail}
        defaultFullName={defaultFullName}
        defaultTradeKind={defaultTradeKind}
      />
    </Card>
  );
}
