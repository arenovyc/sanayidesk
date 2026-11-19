import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink({
  href,
  label = "Geri",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-10 items-center gap-0.5 px-1 text-sm font-medium text-neutral-600 active:text-neutral-950"
    >
      <ChevronLeft className="size-5 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}