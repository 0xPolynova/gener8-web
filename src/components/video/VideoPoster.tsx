import { cn } from "@/lib/utils";
import type { PosterPalette } from "@/types";

export function VideoPoster({
  palette,
  title,
  className,
}: {
  palette: PosterPalette;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 80% at 20% 10%, ${palette.via}, transparent 55%),
          radial-gradient(90% 70% at 90% 90%, ${palette.accent}22, transparent 50%),
          linear-gradient(160deg, ${palette.from}, ${palette.to})`,
      }}
    >
      <div
        className="absolute -left-10 top-8 h-40 w-40 rounded-full opacity-50 blur-3xl"
        style={{ background: palette.accent }}
      />
      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,#000_3px)]" />
      {title && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="line-clamp-2 text-sm font-medium text-paper/90">
            {title}
          </p>
        </div>
      )}
    </div>
  );
}
