"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sd_shop_code_banner_dismissed";

export function ShopCodeBanner({ shopCode }: { shopCode: string | undefined }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shopCode) return;
    try {
      if (window.localStorage.getItem(`${STORAGE_KEY}:${shopCode}`) === "1") {
        return;
      }
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, [shopCode]);

  if (!shopCode || !visible) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:${shopCode}`, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    router.replace("/today");
  }

  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Dükkanınız hazır!</p>
          <p className="mt-1 text-amber-900/90">
            Ustalarınızın PIN ile gireceği dükkan kodu:{" "}
            <span className="font-mono font-semibold tracking-wide">{shopCode}</span>
          </p>
          <p className="mt-2">
            <Link
              href="/team"
              className="font-medium underline-offset-4 hover:underline"
            >
              Usta ekle
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-amber-900/70 hover:bg-amber-100 hover:text-amber-950"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
