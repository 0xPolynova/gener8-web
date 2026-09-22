"use client";

import Link from "next/link";
import { Check, Lock, Wallet, Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/components/providers/AppState";
import { TOKEN_GATING } from "@/lib/config/gating";
import { VIDEO_MODELS, displayModelName } from "@/lib/config/models";
import { formatTokenBalance } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIER_COPY: Record<number, { blurb: string; perks: string[] }> = {
  1: {
    blurb: "The door in. Hold enough GENER8 to generate.",
    perks: ["Private studio", "Publish to Discover"],
  },
  2: {
    blurb: "Adds Seedance 2.0, Kling 3.0 Standard, Wan 2.7, and Veo 3.1 Fast.",
    perks: [],
  },
  3: {
    blurb: "Adds Wan 3.0, Seedance 2.5, Kling 3.0 Pro, Veo 3.1, and Sora 2 Pro.",
    perks: [],
  },
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
        Gener8 is hold-to-use. You don’t spend or burn the token to generate —
        keep {formatTokenBalance(minHold)}+ GENER8 in the wallet you connect,
        and the studio unlocks. Higher balances open more models and more
        generations per day.
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
          const copy = TIER_COPY[tier.id];
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
              <p className="mt-4 text-sm leading-relaxed text-paper/90">
                {copy?.blurb}
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />
                  {tier.dailyGenerations} generations / day
                </li>
                {tier.id > 1 && (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />
                    Everything in {TOKEN_GATING.tiers[tier.id - 2]?.label}
                  </li>
                )}
                {VIDEO_MODELS.filter((model) => model.minTier === tier.id).map((model) => (
                  <li key={model.id} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />
                    {displayModelName(model.id)}
                  </li>
                ))}
                {copy?.perks
                  .filter((perk) => !/model/i.test(perk) && !/generation/i.test(perk))
                  .map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />
                      {perk}
                    </li>
                  ))}
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
            body: "Keep the minimum balance. GENER8 is not deducted when you generate.",
          },
          {
            icon: Clapperboard,
            title: "Create",
            body: "Generate up to your daily cap. Limits reset at midnight UTC.",
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
            <p className="text-sm font-medium">Not a pay-per-video meter</p>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              Holding GENER8 is the access key. Drop below your tier’s minimum
              and that day’s extra models or quota lock until the balance is
              back. Daily counts reset at 00:00 UTC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
