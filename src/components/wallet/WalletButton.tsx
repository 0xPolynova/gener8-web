"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Copy, LogOut, UserRound, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { abbreviateAddress } from "@/lib/format";
import { isProfileComplete } from "@/lib/profileComplete";
import { cn } from "@/lib/utils";
import {
  WALLET_OPTIONS,
  connectInjectedWallet,
  getInjectedProvider,
  isWalletInstalled,
  type WalletOptionName,
} from "@/lib/solana/browserWallet";
import { PhantomMark, SolflareMark } from "@/components/brand/WalletIcons";

export function WalletButton() {
  const { walletAddress, user, connecting, connectWallet, signOut } =
    useAppState();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const openConnect = () => setOpen(true);
    window.addEventListener("gener8:connect", openConnect);
    return () => window.removeEventListener("gener8:connect", openConnect);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), 500);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu]);

  const busy = connecting || pending;

  const pickWallet = async (name: WalletOptionName, url: string) => {
    if (!getInjectedProvider(name)) {
      window.open(url, "_blank", "noopener,noreferrer");
      setError(`Install ${name}, then refresh this page and click Connect again.`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const address = await connectInjectedWallet(name);
      await connectWallet(address);
      setOpen(false);
    } catch (caught) {
      const message =
        caught instanceof Error && caught.message
          ? caught.message
          : "Couldn’t connect that wallet.";
      console.error("[gener8] wallet connect failed", caught);
      setError(message);
      toast(message, "error");
    } finally {
      setPending(false);
    }
  };

  if (walletAddress) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          className="flex h-9 items-center gap-2 rounded-full border border-line bg-elevated pl-1 pr-2.5 transition-colors hover:border-[#333]"
        >
          <Avatar
            name={user?.displayName ?? walletAddress}
            palette={user?.avatarPalette}
            src={user?.avatarUrl}
            size={26}
          />
          <span className="hidden text-[13px] text-paper sm:inline">
            {isProfileComplete(user)
              ? user?.username
              : abbreviateAddress(walletAddress)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>
        {menu && (
            <div className="absolute right-0 z-60 mt-2 w-52 overflow-hidden rounded-[10px] border border-line bg-surface py-1 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
              {user?.username && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-paper hover:bg-elevated"
                  onClick={() => {
                    setMenu(false);
                    router.push(`/profile/${user.username}`);
                  }}
                >
                  <UserRound className="h-4 w-4 text-muted" />
                  Profile
                </button>
              )}
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-paper hover:bg-elevated"
                onClick={async () => {
                  await navigator.clipboard.writeText(walletAddress);
                  toast("Wallet address copied", "success");
                  setMenu(false);
                }}
              >
                <Copy className="h-4 w-4 text-muted" />
                Copy address
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-paper hover:bg-elevated"
                onClick={async () => {
                  setMenu(false);
                  await signOut();
                }}
              >
                <LogOut className="h-4 w-4 text-muted" />
                Disconnect
              </button>
            </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        disabled={busy}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Wallet className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {busy ? "Connecting…" : "Connect"}
        </span>
      </Button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        className="max-w-[320px] px-4 py-6"
      >
        <h2 className="text-base font-semibold tracking-tight">Connect wallet</h2>
        <p className="mt-1.5 text-sm text-muted">
          {busy
            ? "Approve the connection in your wallet."
            : "Pick Phantom or Solflare and approve the popup. That’s it."}
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          {WALLET_OPTIONS.map((w) => {
            const installed = isWalletInstalled(w.name);
            const Icon = w.name === "Phantom" ? PhantomMark : SolflareMark;
            return (
              <button
                key={w.name}
                type="button"
                disabled={busy}
                onClick={() => void pickWallet(w.name, w.installUrl)}
                className={cn(
                  "flex h-12 items-center gap-2.5 rounded-[10px] border border-line bg-elevated px-2.5 text-sm transition-colors hover:border-[#3a3a3a] disabled:opacity-50",
                )}
              >
                <Icon className="h-7 w-7 shrink-0" />
                <span className="flex-1 text-left">{w.name}</span>
                {installed ? (
                  <span className="text-[11px] text-yellow">Detected</span>
                ) : (
                  <span className="text-[11px] text-muted">Install</span>
                )}
              </button>
            );
          })}
        </div>
        {error && (
          <p className="mt-3 rounded-[8px] border border-[#3a1515] bg-[#1a0a0a] px-3 py-2 text-xs text-paper">
            {error}
          </p>
        )}
      </Modal>
    </>
  );
}
