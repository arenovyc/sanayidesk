import { Card } from "@/components/ui/card";
import { PinForm } from "@/components/auth/pin-form";
import { SetupBanner } from "@/components/setup-banner";

export default function PinPage() {
  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <SetupBanner />
      <Card className="w-full">
        <h1 className="mb-1 text-xl font-semibold">Usta girişi</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Dükkan kodu ve 4 haneli PIN. E-posta gerekmez.
        </p>
        <PinForm />
      </Card>
    </div>
  );
}
