import { Suspense } from "react";
import { HomeContent } from "@/components/landing/home-content";
import {
  getAuthUser,
  getSessionContext,
  isPlatformAdminEmail,
} from "@/lib/auth/get-membership";
import { homeForRole } from "@/lib/auth/roles";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#09090b] text-sm text-zinc-500">
          Yükleniyor…
        </div>
      }
    >
      <HomeBody />
    </Suspense>
  );
}

async function HomeBody() {
  const [ctx, authUser] = await Promise.all([
    getSessionContext(),
    getAuthUser(),
  ]);

  const sessionLoggedIn = Boolean(authUser);
  const panelHref = ctx ? homeForRole(ctx.membership.role) : null;
  const showPlatformAdmin = isPlatformAdminEmail(authUser?.email ?? null);

  return (
    <HomeContent
      sessionLoggedIn={sessionLoggedIn}
      panelHref={panelHref}
      showPlatformAdmin={showPlatformAdmin}
    />
  );
}