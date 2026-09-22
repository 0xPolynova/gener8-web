import { XLogo } from "@/components/brand/XLogo";
import { xProfileUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

export function XLink({
  handle,
  className,
  compact,
}: {
  handle?: string | null;
  className?: string;
  compact?: boolean;
}) {
  if (!handle) return null;
  return (
    <a
      href={xProfileUrl(handle)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${handle} on X`}
      className={cn(
        "inline-flex items-center gap-1 text-muted transition-colors hover:text-yellow",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <XLogo className="h-3.5 w-3.5" />
      {!compact && <span className="text-[13px]">@{handle}</span>}
    </a>
  );
}
