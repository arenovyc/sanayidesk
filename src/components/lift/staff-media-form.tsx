"use client";

import { useActionState, useState } from "react";
import {
  staffUploadMediaAction,
  type StaffActionState,
} from "@/app/(lift)/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MEDIA_TAG_LABELS, MEDIA_TAG_OPTIONS } from "@/lib/media/tags";
import type { MediaTag } from "@/lib/work-orders/types";
import { cn } from "@/lib/utils";

const initial: StaffActionState = { error: null };

export function StaffMediaForm({ workOrderId }: { workOrderId: string }) {
  const [state, action, pending] = useActionState(staffUploadMediaAction, initial);
  const [tag, setTag] = useState<MediaTag | "">("");

  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
      encType="multipart/form-data"
    >
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <input type="hidden" name="tag" value={tag} />
      <p className="text-sm font-medium text-neutral-950">Foto çek / yükle</p>
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
      <Label htmlFor="lift-file">Görsel</Label>
      <input
        id="lift-file"
        name="file"
        type="file"
        accept="image/*"
        capture="environment"
        required
        className="text-sm"
      />
      <Button type="submit" size="lg" disabled={pending}>
        Yükle
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
