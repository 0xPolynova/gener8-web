"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { AppStateProvider } from "./AppState";
import { GenerationProvider } from "./GenerationState";
import SolanaProviderInner from "./SolanaProviderInner";
import { SignupModal } from "@/components/wallet/SignupModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaProviderInner>
      <ToastProvider>
        <AppStateProvider>
          <GenerationProvider>
            {children}
            <SignupModal />
          </GenerationProvider>
        </AppStateProvider>
      </ToastProvider>
    </SolanaProviderInner>
  );
}
