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
    pathname.startsWith("/gener8/")
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  const chat = !hideChat(pathname);

  return (
    <div className="flex min-h-full flex-col bg-ink">
      <Navbar />
      <main
        className={`mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 md:px-6 ${
          chat ? "pb-[220px] md:pb-[160px]" : "pb-24"
        }`}
      >
        {children}
      </main>
      {chat && <OmniBox />}
      <MobileNav />
    </div>
  );
}
