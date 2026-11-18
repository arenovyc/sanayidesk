import { CounterToday } from "@/components/desk/counter-today";
import { WorkshopToday } from "@/components/desk/workshop-today";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { isCounterTrade } from "@/lib/trade/kinds";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shopCode?: string }>;
}) {
  const ctx = await requireDeskSession();
  const query = await searchParams;
  const tradeKind = ctx.workspace.tradeKind;

  if (isCounterTrade(tradeKind)) {
    return (
      <CounterToday
        ctx={ctx}
        tradeKind={tradeKind}
        shopCode={query.shopCode}
        q={query.q}
      />
    );
  }

  return (
    <WorkshopToday
      ctx={ctx}
      tradeKind={tradeKind}
      shopCode={query.shopCode}
      q={query.q}
    />
  );
}
