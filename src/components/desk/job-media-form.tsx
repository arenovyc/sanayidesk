"use client";

import { useActionState, useRef } from "react";
import {
  uploadJobMediaAction,
  type MoneyActionState,
} from "@/app/(desk)/jobs/money-actions";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import type { MediaRow } from "@/lib/work-orders/types";

const initial: MoneyActionState = { error: null };

export function JobMediaPanel({
  workOrderId,
  media,
  signedUrls,
  schemaMissing,
}: {
  workOrderId: string;
  media: MediaRow[];
  signedUrls: Record<string, string>;
  schemaMissing?: boolean;
}) {
  const [state, action, pending] = useActionState(uploadJobMediaAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (schemaMissing) {
    return <SchemaHintBanner missing />;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-neutral-500">Fotoğraflar</h2>
      {media.length === 0 ? (
        <p className="text-sm text-neutral-400">Henüz foto yok.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {media.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
            >
              {signedUrls[item.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signedUrls[item.id]}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <p className="p-3 text-xs text-neutral-400">{item.storagePath}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3"
        encType="multipart/form-data"
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <input
          ref={inputRef}
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required
          className="sr-only"
          disabled={pending}
          onChange={() => {
            if (inputRef.current?.files?.length) {
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button
          type="button"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Yükleniyor…" : "Fotoğraf Çek / Ekle"}
        </button>
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      </form>
    </section>
  );
}
