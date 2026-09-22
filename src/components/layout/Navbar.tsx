"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { WalletButton } from "@/components/wallet/WalletButton";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/creations", label: "My Creations" },
  { href: "/gener8", label: "$GENER8" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active ? "text-yellow" : "text-muted hover:text-paper",
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-px bg-yellow" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
