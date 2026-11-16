"use client";

import { useActionState } from "react";
import {
  uploadJobMediaAction,
  type MoneyActionState,
} from "@/app/(desk)/jobs/money-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
        action={action}
        className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3"
        encType="multipart/form-data"
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <Label htmlFor="file">JPEG / PNG (max 5 MB)</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-sm"
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-fit">
          Foto yükle
        </Button>
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      </form>
    </section>
  );
}
