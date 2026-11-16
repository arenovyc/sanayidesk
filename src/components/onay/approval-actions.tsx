"use client";

import { useState, useTransition } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function ApprovalActions({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [askOpen, setAskOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "asked" | null>(null);

  async function callRpc(
    name: "public_approve_quote" | "public_ask_about_quote",
    args: Record<string, unknown>,
  ) {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Bağlantı kurulamadı.");
      return false;
    }
    const { error: rpcError } = await supabase.rpc(name, args);
    if (rpcError) {
      const msg = rpcError.message.toLowerCase();
      if (msg.includes("invalid_status") || msg.includes("invalid_transition")) {
        setError("Bu teklif artık onaylanamaz. Dükkanı arayın.");
      } else if (msg.includes("invalid_note")) {
        setError("Kısa bir not yazın.");
      } else if (msg.includes("not_found")) {
        setError("Link geçersiz veya süresi dolmuş.");
      } else {
        setError("İşlem başarısız. Tekrar deneyin.");
      }
      return false;
    }
    return true;
  }

  if (done === "approved") {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        Onayınız alındı. İşleme başlanacak.
      </p>
    );
  }
  if (done === "asked") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Notunuz dükkana iletildi. Sizi arayacaklar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const ok = await callRpc("public_approve_quote", {
              _token: token,
              _ip: null,
            });
            if (ok) setDone("approved");
          });
        }}
      >
        {pending ? "Kaydediliyor…" : "Onaylıyorum, İşleme Başlansın"}
      </button>

      {!askOpen ? (
        <button
          type="button"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 disabled:opacity-50"
          onClick={() => setAskOpen(true)}
        >
          Fiyat / İşlem Hakkında Sorum Var
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3">
          <label htmlFor="note" className="text-sm font-medium text-neutral-700">
            Kısa notunuz
          </label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-950"
            placeholder="Örn. balata markası ne olacak?"
          />
          <button
            type="button"
            disabled={pending || note.trim().length < 2}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const ok = await callRpc("public_ask_about_quote", {
                  _token: token,
                  _note: note.trim(),
                  _ip: null,
                });
                if (ok) setDone("asked");
              });
            }}
          >
            Notu gönder
          </button>
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
