"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Clapperboard, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/components/providers/AppState";

const ITEMS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/creations", label: "Creations", icon: Clapperboard },
  { href: "/gener8", label: "$GENER8", icon: Coins },
];

export function MobileNav() {
  const pathname = usePathname();
  const { walletAddress } = useAppState();
  const items = walletAddress ? ITEMS : ITEMS.filter((item) => item.href !== "/creations");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className={`grid h-14 ${items.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                active ? "text-yellow" : "text-muted",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
