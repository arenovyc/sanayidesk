"use client";

import { useActionState, useRef, useState } from "react";
import {
  uploadJobMediaAction,
  type MoneyActionState,
} from "@/app/(desk)/jobs/money-actions";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { MEDIA_TAG_LABELS, MEDIA_TAG_OPTIONS } from "@/lib/media/tags";
import type { MediaRow, MediaTag } from "@/lib/work-orders/types";
import { cn } from "@/lib/utils";

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
  const [tag, setTag] = useState<MediaTag | "">("");

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
              className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white"
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
              {item.tag ? (
                <span className="absolute left-1.5 top-1.5 rounded bg-neutral-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {MEDIA_TAG_LABELS[item.tag]}
                </span>
              ) : null}
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
        <input type="hidden" name="tag" value={tag} />
        <div className="flex flex-wrap gap-1.5">
          {MEDIA_TAG_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                tag === option
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700",
              )}
              onClick={() => setTag((prev) => (prev === option ? "" : option))}
            >
              {MEDIA_TAG_LABELS[option]}
            </button>
          ))}
        </div>
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
