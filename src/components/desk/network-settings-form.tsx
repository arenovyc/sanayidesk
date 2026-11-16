"use client";

import { useActionState } from "react";
import {
  updateNetworkSettingsAction,
  type NetworkActionState,
} from "@/app/(desk)/network-actions";
import { Button } from "@/components/ui/button";

const initial: NetworkActionState = { error: null };

export function NetworkSettingsForm({
  shareVehicleHistory,
  networkVisible,
}: {
  shareVehicleHistory: boolean;
  networkVisible: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateNetworkSettingsAction,
    initial,
  );

  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <h2 className="font-medium">Ağ ve paylaşım</h2>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="shareVehicleHistory"
          value="on"
          defaultChecked={shareVehicleHistory}
          className="mt-1"
        />
        <span>
          <span className="font-medium">Plaka geçmişini paylaş</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            Diğer dükkanlar bu dükkandaki plaka özetini (para olmadan) görebilir.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="networkVisible"
          value="on"
          defaultChecked={networkVisible}
          className="mt-1"
        />
        <span>
          <span className="font-medium">Ağda görün</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            Sanayi ağı listesinde dükkan adın ve iletişim görünsün.
          </span>
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        Ağ ayarlarını kaydet
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
