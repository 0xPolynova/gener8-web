"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Eligibility, Session, User } from "@/types";
import { createContext, useContext } from "react";
import { publicErrorMessage } from "@/lib/errors";
import { apiFetch, setApiToken } from "@/lib/api";
import { isProfileComplete } from "@/lib/profileComplete";
import { disconnectInjectedWallet } from "@/lib/solana/browserWallet";

const WALLET_KEY = "gener8_wallet";

interface AppContextValue {
  walletAddress: string | null;
  session: Session | null;
  user: User | null;
  eligibility: Eligibility | null;
  loading: boolean;
  connecting: boolean;
  needsOnboarding: boolean;
  refresh: () => Promise<void>;
  connectWallet: (address: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeProfile: (form: FormData) => Promise<User>;
}

const AppContext = createContext<AppContextValue | null>(null);

const FALLBACK_ELIGIBILITY: Eligibility = {
  state: "disconnected",
  balance: null,
  required: Number(process.env.NEXT_PUBLIC_GENER8_MIN_BALANCE ?? 10_000),
  remainingToday: null,
  dailyLimit: 5,
  tier: null,
};

function readStoredWallet() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WALLET_KEY);
}

async function lookupWallet(wallet: string) {
  const res = await apiFetch("/api/auth/connect", {
    method: "POST",
    body: JSON.stringify({ wallet }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || publicErrorMessage("INTERNAL"));
  }
  return data as {
    session: Session | null;
    user: User | null;
    token: string | null;
    needsOnboarding: boolean;
  };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const refreshGen = useRef(0);

  const refresh = useCallback(async (addressOverride?: string | null) => {
    const gen = ++refreshGen.current;
    const wallet = addressOverride ?? readStoredWallet();
    try {
      const sessionRes = await apiFetch("/api/auth/session");
      if (gen !== refreshGen.current) return;
      const sessionJson = await sessionRes.json().catch(() => ({}));
      let nextSession: Session | null = sessionJson.session ?? null;
      let nextUser: User | null = sessionJson.user ?? null;

      const sessionWallet = nextSession?.walletAddress?.toLowerCase() ?? "";
      const connectedWallet = wallet?.toLowerCase() ?? "";
      const sessionFits =
        Boolean(connectedWallet) &&
        sessionWallet === connectedWallet &&
        isProfileComplete(nextUser);

      if (connectedWallet && !sessionFits) {
        const found = await lookupWallet(wallet!);
        if (gen !== refreshGen.current) return;
        if (typeof found.token === "string") setApiToken(found.token);
        else setApiToken(null);
        if (isProfileComplete(found.user)) {
          nextSession = found.session;
          nextUser = found.user;
        } else {
          nextSession = null;
          nextUser = found.user;
        }
      }

      const tokenRes = await apiFetch("/api/token/balance");
      const tokenJson = await tokenRes.json().catch(() => ({}));
      if (gen !== refreshGen.current) return;
      setSession(nextSession);
      setUser(nextUser);
      setEligibility(tokenJson.eligibility ?? FALLBACK_ELIGIBILITY);
    } catch {
      if (gen !== refreshGen.current) return;
      setEligibility(FALLBACK_ELIGIBILITY);
    } finally {
      if (gen === refreshGen.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = readStoredWallet();
    setWalletAddress(stored);
    void refresh(stored);
  }, [refresh]);

  const connectWallet = useCallback(async (address: string) => {
    setConnecting(true);
    setLoading(true);
    try {
      localStorage.setItem(WALLET_KEY, address);
      setWalletAddress(address);
      await refresh(address);
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const signOut = useCallback(async () => {
    localStorage.removeItem(WALLET_KEY);
    setWalletAddress(null);
    setApiToken(null);
    setSession(null);
    setUser(null);
    try {
      await disconnectInjectedWallet();
    } catch {
      /* ignore */
    }
    void apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await refresh(null);
  }, [refresh]);

  const completeProfile = useCallback(async (form: FormData) => {
    const address = walletAddress ?? readStoredWallet();
    if (address && !form.get("wallet")) form.set("wallet", address);
    const res = await apiFetch("/api/me/profile", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || publicErrorMessage("INTERNAL"));
    if (typeof data.token === "string") setApiToken(data.token);
    setSession(data.session ?? null);
    setUser(data.user ?? null);
    await refresh();
    if (!data.user) throw new Error(publicErrorMessage("INTERNAL"));
    return data.user as User;
  }, [refresh, walletAddress]);

  const needsOnboarding = Boolean(
    !loading &&
      !connecting &&
      walletAddress &&
      !isProfileComplete(user),
  );

  const value = useMemo(
    () => ({
      walletAddress,
      session,
      user,
      eligibility,
      loading,
      connecting,
      needsOnboarding,
      refresh,
      connectWallet,
      signOut,
      completeProfile,
    }),
    [
      walletAddress,
      session,
      user,
      eligibility,
      loading,
      connecting,
      needsOnboarding,
      refresh,
      connectWallet,
      signOut,
      completeProfile,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
