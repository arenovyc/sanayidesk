import { Suspense } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listRecentMessageEvents } from "@/lib/data/message-events";

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <MessagesBody />
    </Suspense>
  );
}

async function MessagesBody() {
  const ctx = await requireDeskSession();
  const { rows, schemaMissing } = await listRecentMessageEvents(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Paylaşım kayıtları"
        backHref="/more"
        backLabel="Daha fazla"
        description="Manuel WhatsApp paylaşımlarının audit kaydı. Otomatik mesaj API’si yok; ham metin saklanmaz (yalnız uzunluk ve özet hash)."
      />

      {schemaMissing ? (
        <SchemaHintBanner missing quietProd />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Henüz kayıt yok"
          description="İş emrinden WhatsApp paylaşınca burada görünür."
        />
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">
                  {row.channel === "whatsapp_manual" ? "WhatsApp" : row.channel}
                </span>
                <time className="text-neutral-500">
                  {new Date(row.createdAt).toLocaleString("tr-TR")}
                </time>
              </div>
              {row.workOrderId ? (
                <Link
                  href={`/jobs/${row.workOrderId}`}
                  className="text-neutral-600 underline-offset-2 hover:underline"
                >
                  {row.displayNo ? `İş ${row.displayNo}` : "İşe git"}
                </Link>
              ) : (
                <span className="text-neutral-400">İş bağlantısı yok</span>
              )}
              <p className="font-mono text-xs text-neutral-400">
                len={row.payloadLen ?? "—"} · sha=
                {row.payloadSha256
                  ? `${row.payloadSha256.slice(0, 12)}…`
                  : "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
