import Link from "next/link";
import { Car } from "lucide-react";
import { AcceptForm } from "@/components/desk/accept-form";
import { ClearRemindButton } from "@/components/desk/clear-remind-button";
import { JobRow } from "@/components/desk/job-row";
import { JobSearch } from "@/components/desk/job-search";
import { ShopCodeBanner } from "@/components/desk/shop-code-banner";
import {
  WhatsAppShareButton,
  WhatsAppShareHint,
} from "@/components/desk/whatsapp-share-button";
import { WorkshopQuickAccept } from "@/components/desk/workshop-quick-accept";
import { OnboardingChecklist } from "@/components/desk/onboarding-checklist";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LicensePlateBadge } from "@/components/ui/license-plate-badge";
import { getTradeProfile } from "@/lib/trade/profile";
import { surfaceCard } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { formatAppointmentTime } from "@/lib/appointments/day-range";
import { istanbulDayBoundsIso } from "@/lib/appointments/day-range";
import type { SessionContext } from "@/lib/auth/types";
import { listTodayScheduledAppointments } from "@/lib/data/appointments";
import {
  getTodayBoard,
  listDueMaintenanceReminders,
  searchWorkOrders,
} from "@/lib/data/work-orders";
import { formatIstanbulDate } from "@/lib/format/date";
import { waMaintenanceReminderMessage } from "@/lib/format/wa-templates";
import { requestNow } from "@/lib/time/request-now";
import type { TradeKind } from "@/lib/trade/kinds";
import {
  BUCKET_LABELS,
  TODAY_BUCKETS,
  type TodayBucket,
} from "@/lib/work-orders/status";

const BUCKET_HREF: Record<TodayBucket, string> = {
  inside: "/board",
  parts: "/board?status=waiting_parts",
  ready: "/board?status=ready",
};

export async function WorkshopToday({
  ctx,
  tradeKind,
  shopCode,
  q,
}: {
  ctx: SessionContext;
  tradeKind: TradeKind;
  shopCode?: string;
  q?: string;
}) {
  const [now, board, searchHits] = await Promise.all([
    requestNow(),
    getTodayBoard(ctx.workspace.id),
    q ? searchWorkOrders(ctx.workspace.id, q) : Promise.resolve([]),
  ]);
  const { startIso, endIso } = istanbulDayBoundsIso(now);
  const [appointments, reminders] = await Promise.all([
    listTodayScheduledAppointments(ctx.workspace.id, startIso, endIso),
    listDueMaintenanceReminders(ctx.workspace.id, endIso),
  ]);

  const description =
    tradeKind === "lastik"
      ? "Hızlı plaka kabul ve kuyruk."
      : tradeKind === "kaporta"
        ? "Plaka kabul, foto ve onay."
        : "Plaka kabul, sıradaki randevu ve açık işler.";

  const profile = getTradeProfile(tradeKind);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Bugün" description={description} />
      <ShopCodeBanner shopCode={shopCode} tradeKind={tradeKind} />
      <OnboardingChecklist steps={profile.onboardingSteps} />

      <section className={cn(surfaceCard, "flex flex-col gap-3 p-4")}>
        <h2 className="text-sm font-medium text-neutral-950">
          {profile.labels.acceptNoun}
        </h2>
        <WorkshopQuickAccept tradeKind={tradeKind} />
        <AcceptForm />
      </section>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {TODAY_BUCKETS.map((bucket) => (
          <Link
            key={bucket}
            href={BUCKET_HREF[bucket]}
            className={cn(surfaceCard, "py-3 transition-colors hover:bg-neutral-50")}
          >
            <dt className="text-xs text-neutral-500">{BUCKET_LABELS[bucket]}</dt>
            <dd className="text-lg font-semibold tabular-nums text-neutral-950">
              {board.counts[bucket]}
            </dd>
          </Link>
        ))}
      </dl>

      <JobSearch />

      {q ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Arama</h2>
          {searchHits.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Bu plaka veya isim açık işlerde yok.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {searchHits.map((job) => (
                <li key={job.id}>
                  <JobRow job={job} tradeKind={tradeKind} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : board.jobs.length === 0 ? (
        <EmptyState
          icon={Car}
          title={profile.labels.emptyToday}
          description="İlk plakayı yukarıdaki kutuya yaz — iş emri hemen açılır."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {board.jobs.map((job) => (
            <li key={job.id}>
              <JobRow job={job} tradeKind={tradeKind} />
            </li>
          ))}
        </ul>
      )}

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
          <ul className={cn(surfaceCard, "divide-y divide-neutral-100")}>
            {appointments.rows.map((appt) => (
              <li key={appt.id}>
                <Link
                  href="/appointments"
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <LicensePlateBadge plate={appt.plate} size="sm" />
                  <span className="tabular-nums text-neutral-500">
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
          <ul className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-sm">
            {reminders.rows.map((row) => {
              const preview = waMaintenanceReminderMessage({
                shopName: ctx.workspace.name,
                plate: row.plate,
                shopPhone: ctx.workspace.settings.phone,
              });
              return (
                <li
                  key={row.id}
                  className="border-b border-amber-100 px-4 py-3 last:border-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Link href={`/jobs/${row.id}`}>
                        <LicensePlateBadge plate={row.plate} size="sm" />
                      </Link>
                      <p className="text-xs tabular-nums text-neutral-500">
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
    </div>
  );
}
