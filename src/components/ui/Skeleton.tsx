import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,#141414_0%,#1c1c1c_40%,#141414_80%)]",
        className,
      )}
    />
  );
}

export function VideoCardSkeleton({
  tall = false,
  portrait = false,
  showMeta = true,
  className,
}: {
  tall?: boolean;
  portrait?: boolean;
  showMeta?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[12px] border border-line bg-surface", className)}>
      <Skeleton
        className={
          className
            ? "h-full w-full"
            : portrait
              ? "aspect-[9/16]"
              : tall
                ? "aspect-[9/14]"
                : "aspect-video"
        }
      />
      {showMeta && (
        <div className="flex items-center gap-2 p-3">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      )}
    </div>
  );
}
