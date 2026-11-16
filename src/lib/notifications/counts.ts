export type DeskNotificationCounts = {
  b2bPending: number;
  unassigned: number;
  ready: number;
  lowStock: number;
};

export function totalNotificationBadge(counts: DeskNotificationCounts): number {
  return (
    counts.b2bPending + counts.unassigned + counts.ready + counts.lowStock
  );
}

export function emptyNotificationCounts(): DeskNotificationCounts {
  return { b2bPending: 0, unassigned: 0, ready: 0, lowStock: 0 };
}
