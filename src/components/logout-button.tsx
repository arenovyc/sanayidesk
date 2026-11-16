import { logoutAction } from "@/app/(auth)/actions";
import { pinLogoutAction } from "@/app/(auth)/pin-actions";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
  mode = "desk",
}: {
  className?: string;
  mode?: "desk" | "staff";
}) {
  return (
    <form action={mode === "staff" ? pinLogoutAction : logoutAction}>
      <Button type="submit" variant="ghost" size="sm" className={className}>
        Çıkış
      </Button>
    </form>
  );
}
