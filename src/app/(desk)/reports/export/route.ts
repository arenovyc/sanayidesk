import { NextResponse, type NextRequest } from "next/server";
import { getSessionContext } from "@/lib/auth/get-membership";
import {
  defaultReportRange,
  listReportPayments,
  paymentsToCsv,
} from "@/lib/data/reports";
import { reportRangeSchema } from "@/lib/validations/reports";

export async function GET(request: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx || ctx.membership.role !== "owner") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const defaults = defaultReportRange();
  const parsed = reportRangeSchema.safeParse({
    from: request.nextUrl.searchParams.get("from") ?? defaults.from,
    to: request.nextUrl.searchParams.get("to") ?? defaults.to,
  });
  const from = parsed.success ? parsed.data.from : defaults.from;
  const to = parsed.success ? parsed.data.to : defaults.to;

  const rows = await listReportPayments(ctx.workspace.id, from, to);
  const csv = paymentsToCsv(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tahsilat-${from}-${to}.csv"`,
    },
  });
}
