"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useState } from "react";
import type { DeskNotificationCounts } from "@/lib/notifications/counts";
import { totalNotificationBadge } from "@/lib/notifications/counts";
import {
  SCHEMA_HINT_DB_PUSH,
  showSchemaHints,
} from "@/lib/ui/schema-hints";

export function DeskBell({
  counts,
  schemaMissing,
}: {
  counts: DeskNotificationCounts;
  schemaMissing?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const total = totalNotificationBadge(counts);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
        aria-label="Bildirimler"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-5" />
        {total > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {total > 99 ? "99+" : total}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {schemaMissing && showSchemaHints() ? (
            <p className="px-3 py-2 text-xs text-amber-800">{SCHEMA_HINT_DB_PUSH}</p>
          ) : schemaMissing ? (
            <p className="px-3 py-2 text-xs text-neutral-500">Bildirim yok.</p>
          ) : (
            <ul className="text-sm">
              <li>
                <Link
                  href="/b2b"
                  className="flex justify-between px-3 py-2.5 hover:bg-neutral-50"
                  onClick={() => setOpen(false)}
                >
                  <span>Bekleyen cari</span>
                  <span className="tabular-nums text-neutral-500">
                    {counts.b2bPending}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/board?unassigned=1"
                  className="flex justify-between px-3 py-2.5 hover:bg-neutral-50"
                  onClick={() => setOpen(false)}
                >
                  <span>Atanmamış iş</span>
                  <span className="tabular-nums text-neutral-500">
                    {counts.unassigned}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/board?status=ready"
                  className="flex justify-between px-3 py-2.5 hover:bg-neutral-50"
                  onClick={() => setOpen(false)}
                >
                  <span>Hazır</span>
                  <span className="tabular-nums text-neutral-500">
                    {counts.ready}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/inventory"
                  className="flex justify-between px-3 py-2.5 hover:bg-neutral-50"
                  onClick={() => setOpen(false)}
                >
                  <span>Düşük stok</span>
                  <span className="tabular-nums text-neutral-500">
                    {counts.lowStock}
                  </span>
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
