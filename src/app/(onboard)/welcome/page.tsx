import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WelcomeWizard } from "@/components/onboard/welcome-wizard";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { homeForRole } from "@/lib/auth/roles";
import { listTeam } from "@/lib/data/ops";

export default function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <WelcomeBody searchParams={searchParams} />
    </Suspense>
  );
}

async function WelcomeBody({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") {
    redirect(homeForRole(ctx.membership.role));
  }

  const query = await searchParams;
  const members = await listTeam(ctx.workspace.id);
  const hasMechanic = members.some(
    (member) => member.role === "mechanic" && member.isActive,
  );

  let initialStep: 1 | 2 | 3 = 1;
  if (query.step === "2") initialStep = 2;
  else if (query.step === "3") initialStep = 3;
  else if (hasMechanic) initialStep = 3;

  return (
    <WelcomeWizard
      shopName={ctx.workspace.name}
      slug={ctx.workspace.slug}
      initialStep={initialStep}
    />
  );
}
