import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TeamPanel } from "@/components/desk/team-forms";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listTeam } from "@/lib/data/ops";
import { hasServiceRoleKey } from "@/lib/supabase/env";

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamBody />
    </Suspense>
  );
}

async function TeamBody() {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") redirect("/more");
  const members = await listTeam(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/more"
          className="text-sm text-neutral-500 underline-offset-4 hover:underline"
        >
          Daha fazla
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Personel</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Usta ve çırak PIN ile girer. Kabulcü e-posta ve şifre ile girer
          (geçici şifre ver; ilk girişten sonra değiştirsin).
        </p>
      </div>
      {!hasServiceRoleKey() ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Kabulcü eklemek için sunucuda{" "}
          <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          tanımlı olmalı. PIN’li usta eklemek için bu anahtar gerekmez.
        </p>
      ) : (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          Kabulcü eklerken verdiğin şifreyi güvenli ilet. Usta için yalnızca PIN
          yeter; e-posta hesabı açılmaz.
        </p>
      )}
      <TeamPanel members={members} />
    </div>
  );
}
