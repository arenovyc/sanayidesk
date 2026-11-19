"use client";

import { useActionState } from "react";
import {
  setWorkOrderStatusAction,
  type JobActionState,
} from "@/app/(desk)/jobs/actions";
import { Button } from "@/components/ui/button";

const initial: JobActionState = { error: null };

export function RemoveSampleJobBanner({ workOrderId }: { workOrderId: string }) {
  const [state, action, pending] = useActionState(
    setWorkOrderStatusAction,
    initial,
  );

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
      <p className="text-sm text-sky-950">
        Bu kayıt deneme amaçlı örnek iş. Listeden kaldırınca Bugün ekranından
        düşer; geçmişte iptal olarak kalır.
      </p>
      <form action={action} className="mt-3">
        <input type="hidden" name="id" value={workOrderId} />
        <input type="hidden" name="status" value="cancelled" />
        <input type="hidden" name="returnTo" value="/today" />
        <Button type="submit" variant="default" disabled={pending}>
          {pending ? "Kaldırılıyor…" : "Örnek işi listeden kaldır"}
        </Button>
      </form>
      {state.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}