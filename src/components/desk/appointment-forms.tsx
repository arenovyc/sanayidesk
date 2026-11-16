"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  convertAppointmentAction,
  createAppointmentAction,
  updateAppointmentStatusAction,
  type AppointmentActionState,
} from "@/app/(desk)/appointment-actions";
import {
  APPOINTMENT_STATUS_LABELS,
  canConvertAppointment,
  type AppointmentStatus,
} from "@/lib/appointments/status";
import { formatAppointmentTime } from "@/lib/appointments/day-range";
import type { AppointmentRow } from "@/lib/data/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AppointmentActionState = { error: null };

export function AppointmentCreateForm() {
  const [state, action, pending] = useActionState(createAppointmentAction, initial);

  return (
    <form
      action={action}
      className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <h2 className="font-medium">Yeni randevu</h2>
      <Label htmlFor="plate">Plaka</Label>
      <Input
        id="plate"
        name="plate"
        required
        className="font-mono uppercase tracking-wider"
        autoCapitalize="characters"
      />
      <Label htmlFor="scheduledAt">Tarih / saat</Label>
      <Input
        id="scheduledAt"
        name="scheduledAt"
        type="datetime-local"
        required
      />
      <Label htmlFor="notes">Not</Label>
      <Input id="notes" name="notes" maxLength={500} />
      <Button type="submit" disabled={pending}>
        Kaydet
      </Button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}

function AppointmentRowActions({ row }: { row: AppointmentRow }) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateAppointmentStatusAction,
    initial,
  );
  const [convertState, convertAction, convertPending] = useActionState(
    convertAppointmentAction,
    initial,
  );

  if (row.status === "converted" && row.workOrderId) {
    return (
      <Link
        href={`/jobs/${row.workOrderId}`}
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        İşe git
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {canConvertAppointment(row.status) ? (
          <form action={convertAction}>
            <input type="hidden" name="appointmentId" value={row.id} />
            <Button type="submit" size="sm" disabled={convertPending}>
              İşe al
            </Button>
          </form>
        ) : null}
        {row.status === "scheduled" ? (
          <>
            <form action={statusAction}>
              <input type="hidden" name="appointmentId" value={row.id} />
              <input type="hidden" name="status" value="arrived" />
              <Button type="submit" size="sm" variant="outline" disabled={statusPending}>
                Geldi
              </Button>
            </form>
            <form action={statusAction}>
              <input type="hidden" name="appointmentId" value={row.id} />
              <input type="hidden" name="status" value="cancelled" />
              <Button type="submit" size="sm" variant="outline" disabled={statusPending}>
                İptal
              </Button>
            </form>
            <form action={statusAction}>
              <input type="hidden" name="appointmentId" value={row.id} />
              <input type="hidden" name="status" value="no_show" />
              <Button type="submit" size="sm" variant="outline" disabled={statusPending}>
                Gelmedi
              </Button>
            </form>
          </>
        ) : null}
      </div>
      {statusState.error || convertState.error ? (
        <p className="text-sm text-red-700">
          {statusState.error ?? convertState.error}
        </p>
      ) : null}
    </div>
  );
}

export function AppointmentList({ rows }: { rows: AppointmentRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-400">Randevu yok.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-base tracking-wide">{row.plate}</p>
              <p className="text-neutral-500">
                {formatAppointmentTime(row.scheduledAt)} ·{" "}
                {APPOINTMENT_STATUS_LABELS[row.status as AppointmentStatus]}
              </p>
              {row.notes ? (
                <p className="mt-1 text-xs text-neutral-400">{row.notes}</p>
              ) : null}
            </div>
          </div>
          <AppointmentRowActions row={row} />
        </li>
      ))}
    </ul>
  );
}

export function AppointmentPanel({ rows }: { rows: AppointmentRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      <AppointmentCreateForm />
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Liste</h2>
        <AppointmentList rows={rows} />
      </section>
    </div>
  );
}
