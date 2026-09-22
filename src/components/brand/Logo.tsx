import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS } from "@/lib/config/cdn";
import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2.5 no-underline",
        className,
      )}
      aria-label="gener8 home"
    >
      <span className="relative grid h-8 w-8 place-items-center">
        <Image
          src={BRAND_ASSETS.logo}
          alt=""
          width={285}
          height={303}
          className="relative h-8 w-auto"
          priority
        />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-paper">
          gener<span className="text-yellow">8</span>
        </span>
      )}
    </Link>
  );
}

export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={BRAND_ASSETS.logo}
      alt=""
      width={285}
      height={303}
      className={cn("h-auto w-auto", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}
