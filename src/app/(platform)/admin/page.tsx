import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { AdminLeadsList } from "@/components/platform/admin-leads";
import { AdminWorkspaceList } from "@/components/platform/admin-workspace-forms";
import { Button } from "@/components/ui/button";
import {
  getAuthUser,
  getSessionContext,
  isPlatformAdminEmail,
} from "@/lib/auth/get-membership";
import { homeForRole } from "@/lib/auth/roles";
import { listAdminWorkspaces } from "@/lib/data/admin-workspaces";
import { listLeadsAdmin } from "@/lib/data/leads";

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-neutral-500">Yükleniyor…</p>}>
      <AdminBody />
    </Suspense>
  );
}

async function AdminBody() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const ctx = await getSessionContext();
  const panelHref = ctx ? homeForRole(ctx.membership.role) : null;

  if (!isPlatformAdminEmail(authUser.email ?? null)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 py-10">
        <div>
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:underline">
              Ana sayfa
            </Link>
          </p>
          <h1 className="mt-1 text-xl font-semibold">Platform yönetimi</h1>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-medium text-neutral-950">
            Bu alan platform yöneticileri içindir.
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Giriş yaptığın e-posta (
            <span className="font-medium text-neutral-800">
              {authUser.email ?? "—"}
            </span>
            ) <code className="rounded bg-neutral-100 px-1 text-xs">PLATFORM_ADMIN_EMAILS</code>{" "}
            listesinde değil. Dükkan paneli ayrı; admin yetkisi Vercel env’den gelir.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {panelHref ? (
              <Button asChild size="sm">
                <Link href={panelHref}>Dükkan paneline git</Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href="/">Ana sayfa</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const [workspaces, leads] = await Promise.all([
    listAdminWorkspaces(),
    listLeadsAdmin(),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-8 px-4 py-10">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:underline">
              Ana sayfa
            </Link>
            {panelHref ? (
              <>
                {" · "}
                <Link href={panelHref} className="hover:underline">
                  Dükkan paneli
                </Link>
              </>
            ) : null}
          </p>
          <h1 className="text-xl font-semibold">Platform</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Kurucu görünümü — tüm self-serve dükkanlar.{" "}
            {panelHref ? (
              <>
                Kendi dükkanın için{" "}
                <Link href={panelHref} className="underline-offset-2 hover:underline">
                  panele geç
                </Link>
                .
              </>
            ) : null}
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Çıkış
          </Button>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Başvurular</h2>
        <AdminLeadsList
          rows={leads.rows}
          schemaMissing={leads.schemaMissing}
          error={leads.error}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Dükkanlar</h2>
        <p className="text-sm text-neutral-500">
          Varsayılan: gerçek müşteri kayıtları. Seed / canlı demo (Başkent vb.)
          ayrı sekmede — aktivasyon ve WhatsApp karşılama burada.
        </p>
        {workspaces.error ? (
          <p className="text-sm text-red-700">{workspaces.error}</p>
        ) : (
          <AdminWorkspaceList rows={workspaces.rows} />
        )}
      </section>
    </div>
  );
}
