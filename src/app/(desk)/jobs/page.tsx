import { redirect } from "next/navigation";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assignee?: string; q?: string }>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.assignee) params.set("assignee", query.assignee);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  redirect(qs ? `/board?${qs}` : "/board");
}
