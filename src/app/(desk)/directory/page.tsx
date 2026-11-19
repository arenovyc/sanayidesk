import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { DirectoryPanel } from "@/components/desk/directory-forms";
import { PageHeader } from "@/components/shells/page-header";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listDirectory } from "@/lib/data/ops";

export default function DirectoryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DirectoryBody />
    </Suspense>
  );
}

async function DirectoryBody() {
  const ctx = await requireDeskSession();
  const contacts = await listDirectory(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Rehber"
        backHref="/neighbors"
        backLabel="Komşular"
        description={
          <>
            Yerel kişiler. Ağ için{" "}
            <Link
              href="/neighbors#ag"
              className="underline-offset-4 hover:underline"
            >
              Komşular
            </Link>
            .
          </>
        }
      />
      <DirectoryPanel contacts={contacts} />
    </div>
  );
}
