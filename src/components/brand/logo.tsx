import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "mark" | "wordmark" | "full";
  tone?: "light" | "dark";
  href?: string | null;
  className?: string;
};

/** Abstract lift-bay mark — no letterforms. */
function Mark({ tone, className }: { tone: "light" | "dark"; className?: string }) {
  const bg = tone === "dark" ? "#FAFAFA" : "#0A0A0A";
  const rail = tone === "dark" ? "#0A0A0A" : "#FAFAFA";
  const amber = "#F59E0B";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-7 shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill={bg} />
      {/* Bay posts */}
      <rect x="8" y="8" width="3" height="16" rx="1" fill={rail} />
      <rect x="21" y="8" width="3" height="16" rx="1" fill={rail} />
      {/* Lift bar */}
      <rect x="8" y="14" width="16" height="3.5" rx="1" fill={amber} />
      {/* Floor line */}
      <rect x="10" y="23" width="12" height="1.5" rx="0.75" fill={rail} opacity="0.45" />
    </svg>
  );
}

function Wordmark({
  tone,
  className,
}: {
  tone: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-base font-semibold tracking-tight",
        tone === "dark" ? "text-white" : "text-neutral-950",
        className,
      )}
    >
      SanayiDesk
      <span className="ml-1 inline-block size-1.5 rounded-sm bg-amber-500 align-middle" />
    </span>
  );
}

export function Logo({
  variant = "full",
  tone = "light",
  href = "/",
  className,
}: LogoProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {variant === "mark" || variant === "full" ? <Mark tone={tone} /> : null}
      {variant === "wordmark" || variant === "full" ? (
        <Wordmark tone={tone} />
      ) : null}
      <span className="sr-only">SanayiDesk</span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  );
}
