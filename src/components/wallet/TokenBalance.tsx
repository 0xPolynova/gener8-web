"use client";

import { Lock } from "lucide-react";
import { useAppState } from "@/components/providers/AppState";
import { formatTokenBalance } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TokenBalance() {
  const { eligibility, session, loading } = useAppState();

  if (!session) return null;

  const eligible = eligibility?.state === "eligible";
  const insufficient = eligibility?.state === "insufficient";
  const limited = eligibility?.state === "limit_reached";
  const balance = eligibility?.balance;

  return (
    <div
      className={cn(
        "hidden h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-medium md:flex",
        eligible
          ? "border-[#3a3200] bg-[#161200] text-yellow yellow-glow-sm"
          : insufficient
            ? "border-line bg-elevated text-muted"
            : "border-line bg-elevated text-paper",
      )}
      title={
        limited
          ? "Daily generation limit reached"
          : insufficient
            ? "More GENER8 required"
            : "GENER8 balance"
      }
    >
      {insufficient && <Lock className="h-3 w-3" />}
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          eligible ? "bg-yellow" : insufficient ? "bg-muted" : "bg-ok",
        )}
      />
      <span>
        {loading || balance == null ? "—" : formatTokenBalance(Math.floor(balance))}
        <span className="ml-1 text-[11px] tracking-wide text-muted">GENER8</span>
      </span>
    </div>
  );
}
