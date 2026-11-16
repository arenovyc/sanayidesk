export const APPOINTMENT_STATUSES = [
  "scheduled",
  "arrived",
  "cancelled",
  "no_show",
  "converted",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Planlandı",
  arrived: "Geldi",
  cancelled: "İptal",
  no_show: "Gelmedi",
  converted: "İşe alındı",
};

export function canConvertAppointment(status: AppointmentStatus): boolean {
  return status === "scheduled" || status === "arrived";
}

export function canUpdateAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  if (from === "converted" && to !== "converted") return false;
  if (from === "cancelled" && to === "converted") return false;
  return APPOINTMENT_STATUSES.includes(to);
}
