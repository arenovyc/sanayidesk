import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/get-membership";
import { homeForRole } from "@/lib/auth/roles";

export async function RedirectIfAuthed() {
  const ctx = await getSessionContext();
  if (ctx) redirect(homeForRole(ctx.membership.role));
  return null;
}
