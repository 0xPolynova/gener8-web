"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { OmniBox } from "@/components/create/OmniBox";

function hideChat(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/creations" ||
    pathname.startsWith("/profile") ||
    pathname === "/gener8" ||
    pathname.startsWith("/gener8/") ||
    pathname.startsWith("/video")
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  const chat = !hideChat(pathname);
  const fullBleed = pathname === "/discover" || pathname === "/creations";

  return (
    <div className="flex min-h-full flex-col bg-ink">
      <Navbar />
      <main
        className={`w-full flex-1 ${
          fullBleed ? "pt-3" : "mx-auto max-w-[1440px] px-4 pt-6 md:px-6"
        } ${chat ? "pb-[200px] md:pb-[150px]" : "pb-24"}`}
      >
        {children}
      </main>
      {chat && <OmniBox />}
      <MobileNav />
    </div>
  );
}
