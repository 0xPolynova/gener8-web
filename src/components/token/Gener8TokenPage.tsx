"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clapperboard, Lock, Wallet } from "lucide-react";
import { useAppState } from "@/components/providers/AppState";
import { TOKEN_GATING } from "@/lib/config/gating";
import { formatTokenBalance } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIER_COPY: Record<number, string> = {
  1: "One generation an hour.",
  2: "Three generations an hour.",
  3: "No hourly cap. Finish one video, then start the next.",
};

const EDGE_SPARKS = [
  { left: "8%", top: "-4px", delay: 0.1, size: 3 },
  { left: "34%", top: "-6px", delay: 0.7, size: 2 },
  { left: "62%", top: "-3px", delay: 1.2, size: 3 },
  { left: "86%", top: "-5px", delay: 0.4, size: 2 },
  { left: "-4px", top: "28%", delay: 0.9, size: 2 },
  { right: "-4px", top: "36%", delay: 0.2, size: 3 },
  { left: "18%", bottom: "-5px", delay: 1.1, size: 2 },
  { left: "48%", bottom: "-4px", delay: 0.5, size: 3 },
  { left: "76%", bottom: "-6px", delay: 1.4, size: 2 },
];

function GoldAura({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute -inset-3 -z-10", className)}>
      <div className="animate-glow absolute inset-2 rounded-[28px] bg-yellow/25 blur-2xl" />
      <div className="absolute inset-x-10 bottom-1 top-6 rounded-full bg-yellow-bright/10 blur-3xl" />
    </div>
  );
}

function EdgeSparks() {
  return (
    <div className="pointer-events-none absolute -inset-2">
      {EDGE_SPARKS.map((spark) => (
        <motion.span
          key={`${spark.left ?? ""}-${spark.right ?? ""}-${spark.top ?? spark.bottom}`}
          aria-hidden
          className="absolute rounded-full bg-yellow shadow-[0_0_8px_#fff176]"
          style={{
            left: spark.left,
            right: spark.right,
            top: spark.top,
            bottom: spark.bottom,
            width: spark.size,
            height: spark.size,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.55, 1.2, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: spark.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Unlimited() {
  const sparks = [
    { left: "6%", top: "-6px", delay: 0 },
    { left: "42%", top: "-4px", delay: 0.4 },
    { left: "78%", top: "-7px", delay: 0.8 },
    { left: "22%", top: "108%", delay: 0.2 },
    { left: "64%", top: "112%", delay: 0.6 },
  ];
  return (
    <span className="relative inline-block font-semibold text-yellow">
      Unlimited generations
      {sparks.map((spark) => (
        <motion.span
          key={`${spark.left}-${spark.top}`}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-yellow shadow-[0_0_6px_#fff176]"
          style={{ left: spark.left, top: spark.top }}
          animate={{ opacity: [0, 0.95, 0], scale: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: spark.delay, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

const LOOP = [
  {
    label: "Rewards",
    body: "Creator rewards fund the API for everyone.",
  },
  {
    label: "Fees",
    body: "People buy GENER8 for access. Trading fees pay for the credits that run generations.",
  },
  {
    label: "Spread",
    body: "The clips that travel bring the next buyers. More fees mean more generations.",
  },
];

export function Gener8TokenPage() {
  const { eligibility, tokenMint } = useAppState();
  const currentTierId = eligibility?.tier?.id ?? null;
  const getTokenUrl =
    (tokenMint ? `https://jup.ag/tokens/${tokenMint}` : null) ||
    TOKEN_GATING.getTokenUrl ||
    process.env.NEXT_PUBLIC_GET_GENER8_URL;
  const minHold = TOKEN_GATING.tiers[0].minimumBalance;

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <section className="relative">
        <GoldAura />
        <div className="relative overflow-hidden rounded-2xl border border-yellow/25 bg-ink/92 px-5 py-6 shadow-2xl backdrop-blur-xl md:px-8 md:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow">
            Token access
          </p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-tight md:text-[48px]">
            $<span className="text-yellow">GENER8</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            Hold it in the wallet you connect. The balance is read when you press Generate.
            It is not saved, and it is not spent. Under {formatTokenBalance(minHold)} you cannot generate.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/discover"
              className="inline-flex h-12 items-center rounded-full bg-yellow px-5 text-[15px] font-semibold text-ink hover:bg-yellow-bright"
            >
              Start creating
            </Link>
            {getTokenUrl ? (
              <a
                href={getTokenUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center rounded-full border border-yellow/30 px-5 text-[15px] font-semibold text-yellow hover:bg-yellow/10"
              >
                BUY $GENER8
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-8 grid items-stretch gap-4 md:grid-cols-3">
        {TOKEN_GATING.tiers.map((tier) => {
          const studio = tier.id === 3;
          const yours = currentTierId === tier.id;
          return (
            <article key={tier.id} className={cn("relative", studio && "md:-mt-2 md:mb-2")}>
              {studio && (
                <>
                  <GoldAura />
                  <EdgeSparks />
                </>
              )}
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-5",
                  studio
                    ? "border-yellow/40 bg-[#16140c] shadow-[0_0_0_1px_rgba(255,241,118,0.12)]"
                    : "border-white/10 bg-white/[0.04]",
                  yours && "ring-1 ring-yellow/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow">
                    {tier.label}
                  </p>
                  {yours ? (
                    <span className="rounded-full bg-yellow px-2 py-0.5 text-[10px] font-bold text-ink">
                      Your tier
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-[32px] font-semibold leading-none tracking-tight">
                  {formatTokenBalance(tier.minimumBalance)}
                </p>
                <p className="mt-2 text-xs text-white/45">
                  {TOKEN_GATING.symbol} held in the wallet
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  {TIER_COPY[tier.id]}
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-yellow" />
                    {studio ? (
                      <Unlimited />
                    ) : (
                      <span>
                        {tier.hourlyGenerations} generation
                        {tier.hourlyGenerations === 1 ? "" : "s"} / hour
                      </span>
                    )}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-yellow" />
                    One video at a time
                  </li>
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Wallet,
            title: "Connect",
            body: "Phantom or Solflare. Access is the wallet you connect.",
          },
          {
            icon: Lock,
            title: "Hold",
            body: "50,000, 100,000, or 300,000 must be there when you generate.",
          },
          {
            icon: Clapperboard,
            title: "Create",
            body: "One an hour, three an hour, or unlimited. One video at a time.",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
          >
            <step.icon className="h-4 w-4 text-yellow" />
            <p className="mt-3 text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/55">{step.body}</p>
          </div>
        ))}
      </div>

      <section className="relative mt-8">
        <GoldAura />
        <div className="relative rounded-2xl border border-yellow/20 bg-ink/92 p-4 backdrop-blur-xl md:p-5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow">
            The loop
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {LOOP.map((item) => (
              <div key={item.label} className="rounded-xl bg-white/[0.06] px-4 py-3">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/60">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
