"use client";

import Link from "next/link";
import { Check, Lock, Wallet, Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/components/providers/AppState";
import { TOKEN_GATING } from "@/lib/config/gating";
import { formatTokenBalance } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIER_COPY: Record<number, string> = {
  1: "One generation an hour.",
  2: "Three generations an hour.",
  3: "Unlimited generations. No hourly cap.",
};

export function Gener8TokenPage() {
  const { eligibility } = useAppState();
  const currentTierId = eligibility?.tier?.id ?? null;
  const getTokenUrl = TOKEN_GATING.getTokenUrl || process.env.NEXT_PUBLIC_GET_GENER8_URL;
  const minHold = TOKEN_GATING.tiers[0].minimumBalance;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] uppercase tracking-[0.18em] text-yellow">Token access</p>
      <h1 className="mt-2 text-[32px] font-semibold tracking-tight md:text-[40px]">
        $<span className="text-yellow">GENER8</span>
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
        Hold GENER8 in the wallet you connect. The balance is read when you
        press Generate. It is not saved, and it is not spent. Under{" "}
        {formatTokenBalance(minHold)} you cannot generate.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/create">
          <Button size="lg">Start creating</Button>
        </Link>
        {getTokenUrl ? (
          <a href={getTokenUrl} target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline">
              Get GENER8
            </Button>
          </a>
        ) : null}
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {TOKEN_GATING.tiers.map((tier) => {
          const blurb = TIER_COPY[tier.id];
          const featured = tier.id === 2;
          const yours = currentTierId === tier.id;
          return (
            <article
              key={tier.id}
              className={cn(
                "flex flex-col rounded-[14px] border bg-surface p-5",
                featured ? "border-yellow/50 md:-mt-1 md:mb-[-4px] md:pt-6" : "border-line",
                yours && "ring-1 ring-yellow/40",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.16em] text-yellow">
                  {tier.label}
                </p>
                {yours ? (
                  <span className="rounded-full bg-yellow/15 px-2 py-0.5 text-[10px] font-medium text-yellow">
                    Your tier
                  </span>
                ) : featured ? (
                  <span className="text-[10px] uppercase tracking-wide text-muted">
                    Most used
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[28px] font-semibold tracking-tight">
                {formatTokenBalance(tier.minimumBalance)}
                <span className="ml-1.5 text-sm font-medium text-muted">
                  {TOKEN_GATING.symbol}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">Minimum held in wallet</p>
              <p className="mt-4 text-sm leading-relaxed text-paper/90">{blurb}</p>
              <ul className="mt-5 space-y-2.5 text-sm">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />
                  {tier.hourlyGenerations == null
                    ? "Unlimited generations"
                    : `${tier.hourlyGenerations} generation${tier.hourlyGenerations === 1 ? "" : "s"} / hour`}
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />
                  One video at a time
                </li>
              </ul>
            </article>
          );
        })}
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Wallet,
            title: "Connect",
            body: "Use Phantom or Solflare. Access is checked against the connected Solana wallet.",
          },
          {
            icon: Lock,
            title: "Hold",
            body: "50,000, 100,000, or 300,000 GENER8 must be in the wallet at the moment you generate.",
          },
          {
            icon: Clapperboard,
            title: "Create",
            body: "One an hour, three an hour, or unlimited. You still finish the current video before the next.",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="rounded-[12px] border border-line bg-elevated p-4"
          >
            <step.icon className="h-4 w-4 text-yellow" />
            <p className="mt-3 text-sm font-medium">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[14px] border border-line bg-surface p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
          <div>
            <p className="text-sm font-medium">The loop</p>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              Creator rewards fund the API for everyone. People buy GENER8 to
              get access. Trading fees from the token pay for the API credits
              that run generations. The clips that spread are how the platform
              grows. More buyers mean more fees, and more fees mean more
              generations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
