import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
  onAction,
  className,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[14px] border border-dashed border-line bg-surface/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-full border border-line bg-elevated">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow" />
      </div>
      <h3 className="text-[15px] font-medium text-paper">{title}</h3>
      {body && (
        <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-8 items-center rounded-[7px] bg-yellow px-3 text-xs font-semibold text-ink yellow-glow-sm transition-all hover:bg-yellow-bright"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button className="mt-5" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
