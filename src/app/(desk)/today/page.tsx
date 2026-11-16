import Link from "next/link";
import { AcceptForm } from "@/components/desk/accept-form";
import { ClearRemindButton } from "@/components/desk/clear-remind-button";
import { JobRow } from "@/components/desk/job-row";
import { JobSearch } from "@/components/desk/job-search";
import {
  WhatsAppShareButton,
  WhatsAppShareHint,
} from "@/components/desk/whatsapp-share-button";
import { PageHeader } from "@/components/shells/page-header";
import { Button } from "@/components/ui/button";
import { formatAppointmentTime } from "@/lib/appointments/day-range";
import { istanbulDayBoundsIso } from "@/lib/appointments/day-range";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listTodayScheduledAppointments } from "@/lib/data/appointments";
import {
  getTodayBoard,
  listDueMaintenanceReminders,
  searchWorkOrders,
} from "@/lib/data/work-orders";
import { formatIstanbulDate } from "@/lib/format/date";
import { waMaintenanceReminderMessage } from "@/lib/format/wa-templates";
import {
  BUCKET_LABELS,
  STATUS_LABELS,
  TODAY_BUCKETS,
} from "@/lib/work-orders/status";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireDeskSession();
  const query = await searchParams;
  const { startIso, endIso } = istanbulDayBoundsIso();
  const [board, searchHits, appointments, reminders] = await Promise.all([
    getTodayBoard(ctx.workspace.id),
    query.q ? searchWorkOrders(ctx.workspace.id, query.q) : Promise.resolve([]),
    listTodayScheduledAppointments(ctx.workspace.id, startIso, endIso),
    listDueMaintenanceReminders(ctx.workspace.id, endIso),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Bugün"
        description="Plaka kabul, sıradaki randevu ve açık işler."
      />
      <AcceptForm />
      <JobSearch />

      {!appointments.schemaMissing && appointments.rows.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-neutral-500">Sıradaki</h2>
            <Link
              href="/appointments"
              className="text-xs font-medium text-neutral-500 underline-offset-4 hover:underline"
            >
              Tümü
            </Link>
          </div>
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {appointments.rows.map((appt) => (
              <li key={appt.id}>
                <Link
                  href="/appointments"
                  className="flex justify-between px-4 py-3 text-sm"
                >
                  <span className="font-mono tracking-wide">{appt.plate}</span>
                  <span className="text-neutral-500">
                    {formatAppointmentTime(appt.scheduledAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!reminders.schemaMissing && reminders.rows.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">
            Bakımı Gelenler
          </h2>
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40">
            {reminders.rows.map((row) => {
              const preview = waMaintenanceReminderMessage({
                shopName: ctx.workspace.name,
                plate: row.plate,
                shopPhone: ctx.workspace.settings.phone,
              });
              return (
                <li key={row.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/jobs/${row.id}`}
                        className="font-mono text-sm tracking-wide hover:underline"
                      >
                        {row.plate}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {formatIstanbulDate(new Date(row.remindAt))}
                        {row.displayNo ? ` · ${row.displayNo}` : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <WhatsAppShareButton
                        workOrderId={row.id}
                        preview={preview}
                        phone={row.customerPhone}
                        label="WhatsApp hatırlat"
                      />
                      <ClearRemindButton workOrderId={row.id} />
                    </div>
                  </div>
                  <WhatsAppShareHint />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {query.q ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Arama</h2>
          {searchHits.length === 0 ? (
            <p className="text-sm text-neutral-400">Sonuç yok.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {searchHits.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-mono tracking-wide">{job.plate}</span>
                    <span className="text-neutral-500">
                      {job.displayNo ?? STATUS_LABELS[job.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <dl className="grid grid-cols-3 gap-2 text-center">
        {TODAY_BUCKETS.map((bucket) => (
          <div
            key={bucket}
            className="rounded-xl border border-neutral-200 bg-white py-3"
          >
            <dt className="text-xs text-neutral-500">{BUCKET_LABELS[bucket]}</dt>
            <dd className="text-lg font-semibold">{board.counts[bucket]}</dd>
          </div>
        ))}
      </dl>

      {board.jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center">
          <p className="text-sm text-neutral-500">Plakayı yaz, iş emri aç.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/jobs/new">Araç Kabul</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {board.jobs.map((job) => (
            <li key={job.id}>
              <JobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
