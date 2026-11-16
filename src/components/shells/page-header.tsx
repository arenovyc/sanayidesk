import Link from "next/link";

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Geri",
  action,
}: {
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {backHref ? (
          <p className="text-sm text-neutral-500">
            <Link href={backHref} className="hover:underline">
              {backLabel}
            </Link>
          </p>
        ) : null}
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
