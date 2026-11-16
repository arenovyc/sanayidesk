"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";

export function JobSearch({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = searchParams.get("q") ?? "";

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const q = String(fd.get("q") ?? "").trim();
        const next = new URLSearchParams(searchParams.toString());
        if (q) next.set("q", q);
        else next.delete("q");
        startTransition(() => {
          router.push(`${pathname}?${next.toString()}`);
        });
      }}
    >
      <Input
        name="q"
        defaultValue={current}
        placeholder={placeholder ?? "Plaka veya iş no"}
        className="flex-1"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium disabled:opacity-50"
      >
        Ara
      </button>
    </form>
  );
}
