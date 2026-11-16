import { Suspense } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { AdminLeadsList } from "@/components/platform/admin-leads";
import { AdminWorkspaceList } from "@/components/platform/admin-workspace-forms";
import { Button } from "@/components/ui/button";
import { requirePlatformAdmin } from "@/lib/auth/get-membership";
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
  await requirePlatformAdmin();
  const [workspaces, leads] = await Promise.all([
    listAdminWorkspaces(),
    listLeadsAdmin(),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-8 px-4 py-10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:underline">
              Ana sayfa
            </Link>
          </p>
          <h1 className="text-xl font-semibold">Platform</h1>
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
          Plan, deneme bitişi ve askıya alma.
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
