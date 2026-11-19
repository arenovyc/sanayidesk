import { parseTrPlate } from "@/lib/format/plate";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: {
    wrap: "h-6 text-[10px] leading-none",
    stripe: "w-3.5 text-[7px]",
    gap: "px-1.5 tracking-wide",
  },
  md: {
    wrap: "h-8 text-xs leading-none",
    stripe: "w-4 text-[8px]",
    gap: "px-2 tracking-wide",
  },
  lg: {
    wrap: "h-10 text-sm leading-none",
    stripe: "w-5 text-[9px]",
    gap: "px-2.5 tracking-wider",
  },
} as const;

export function LicensePlateBadge({
  plate,
  size = "sm",
  className,
}: {
  plate: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const parsed = parseTrPlate(plate);
  const s = SIZE[size];
  const text = parsed.official
    ? `${parsed.city} ${parsed.letters} ${parsed.numbers}`
    : parsed.formatted || "—";

  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 overflow-hidden rounded-[4px] border-[1.5px] border-neutral-950 bg-white font-semibold text-neutral-950",
        s.wrap,
        className,
      )}
      title={text}
    >
      <span
        className={cn(
          "flex shrink-0 flex-col items-center justify-center bg-[#003399] font-bold text-white",
          s.stripe,
        )}
        aria-hidden
      >
        TR
      </span>
      <span
        className={cn(
          "flex min-w-0 items-center font-mono tabular-nums",
          s.gap,
        )}
      >
        <span className="truncate">{text}</span>
      </span>
    </span>
  );
}
