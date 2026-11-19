import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Button } from "@/components/ui/button";
import { getAuthUser, requireDeskSession } from "@/lib/auth/get-membership";

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AccountBody />
    </Suspense>
  );
}

function hasEmailPasswordIdentity(
  identities: { provider: string }[] | undefined,
) {
  return Boolean(identities?.some((identity) => identity.provider === "email"));
}

async function AccountBody() {
  const ctx = await requireDeskSession();
  const authUser = await getAuthUser();
  const email = ctx.authEmail ?? authUser?.email ?? "—";
  const canChangePassword = hasEmailPasswordIdentity(authUser?.identities);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/more"
          className="text-sm text-neutral-500 underline-offset-4 hover:underline"
        >
          Daha fazla
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Hesap</h1>
      </div>
      <dl className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm">
        <div className="flex justify-between gap-3 py-1.5">
          <dt className="text-neutral-500">E-posta</dt>
          <dd className="truncate font-medium">{email}</dd>
        </div>
        <div className="flex justify-between gap-3 py-1.5">
          <dt className="text-neutral-500">Rol</dt>
          <dd className="font-medium">
            {ctx.membership.role === "owner" ? "Patron" : "Kabulcü"}
          </dd>
        </div>
        <div className="flex justify-between gap-3 py-1.5">
          <dt className="text-neutral-500">Dükkan</dt>
          <dd className="truncate font-medium">{ctx.workspace.name}</dd>
        </div>
      </dl>
      {canChangePassword ? (
        <ChangePasswordForm />
      ) : (
        <p className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Bu hesap Google ile giriş yapıyor. Şifre değiştirme e-posta/şifre
          hesapları için geçerlidir.
        </p>
      )}
      <form action={logoutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Çıkış
        </Button>
      </form>
    </div>
  );
}
