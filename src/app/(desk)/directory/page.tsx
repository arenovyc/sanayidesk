import { Suspense } from "react";
import Link from "next/link";
import { DirectoryPanel } from "@/components/desk/directory-forms";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listDirectory } from "@/lib/data/ops";

export default function DirectoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <DirectoryBody />
    </Suspense>
  );
}

async function DirectoryBody() {
  const ctx = await requireDeskSession();
  const contacts = await listDirectory(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Parçacı rehberi</h1>
      <p className="text-sm text-neutral-500">
        Yerel kişiler. Sanayi dükkanları için{" "}
        <Link href="/network" className="underline-offset-4 hover:underline">
          ağ listesi
        </Link>
        .
      </p>
      <DirectoryPanel contacts={contacts} />
    </div>
  );
}
