"use client";

import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { OmniBox } from "@/components/create/OmniBox";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-ink">
      <Navbar />
      {/* Extra bottom padding so content clears the fixed OmniBox + MobileNav */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-[220px] pt-6 md:px-6 md:pb-[160px]">
        {children}
      </main>
      <OmniBox />
      <MobileNav />
    </div>
  );
}
