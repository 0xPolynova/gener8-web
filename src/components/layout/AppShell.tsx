"use client";

import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-ink">
      <Navbar />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-10">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
