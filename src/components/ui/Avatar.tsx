import { cn } from "@/lib/utils";
import type { PosterPalette } from "@/types";

const FALLBACK_PALETTE: PosterPalette = {
  from: "#050505",
  via: "#16120a",
  to: "#2a2208",
  accent: "#FFF176",
};

export function Avatar({
  name,
  palette = FALLBACK_PALETTE,
  src,
  size = 32,
  className,
}: {
  name: string;
  palette?: PosterPalette | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const colors = palette ?? FALLBACK_PALETTE;
  const initial = (name?.[0] ?? "g").toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full text-ink font-semibold",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.38),
        background: `linear-gradient(145deg, ${colors.from}, ${colors.via} 48%, ${colors.accent})`,
      }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <span className="relative z-10 mix-blend-luminosity text-paper">
            {initial}
          </span>
          <span
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${colors.accent}, transparent 55%)`,
            }}
          />
        </>
      )}
    </span>
  );
}
