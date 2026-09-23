"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAppState } from "@/components/providers/AppState";
import { TOKEN_GATING } from "@/lib/config/gating";
import { formatTokenBalance } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DiscoverBackdrop } from "./DiscoverBackdrop";

const STEPS = [
  {
    title: "Connect",
    body: "Phantom or Solflare. The wallet you connect is the one that is checked.",
  },
  {
    title: "Hold",
    body: "50,000, 100,000, or 300,000. Read live when you press Generate. It stays in the wallet.",
  },
  {
    title: "Create",
    body: "One an hour, three an hour, or unlimited. One video finishes before the next starts.",
  },
];

const LOOP = [
  { label: "Rewards", body: "Creator rewards fund the API." },
  { label: "Fees", body: "Trading fees pay for the credits." },
  { label: "Spread", body: "Clips that travel bring the next buyers." },
];

const SPARKS = [
  { left: "12%", top: "8%", delay: 0.1, size: 3 },
  { left: "78%", top: "14%", delay: 0.8, size: 2 },
  { left: "88%", top: "62%", delay: 0.4, size: 3 },
  { left: "22%", top: "78%", delay: 1.2, size: 2 },
  { left: "60%", top: "42%", delay: 0.6, size: 2 },
];

function rateLabel(hourly: number | null) {
  if (hourly == null) return "Unlimited";
  return `${hourly} / hour`;
}

export function Gener8TokenPage() {
  const { eligibility, tokenMint } = useAppState();
  const currentTierId = eligibility?.tier?.id ?? null;
  const getTokenUrl =
    (tokenMint ? `https://jup.ag/tokens/${tokenMint}` : null) ||
    TOKEN_GATING.getTokenUrl ||
    process.env.NEXT_PUBLIC_GET_GENER8_URL;
  const minHold = TOKEN_GATING.tiers[0].minimumBalance;

  return (
    <div className="relative z-10 mx-auto max-w-5xl pb-10">
      <DiscoverBackdrop />
      <section className="relative">
        <div className="pointer-events-none absolute -inset-4 -z-10">
          <div className="animate-glow absolute inset-6 rounded-[36px] bg-yellow/20 blur-3xl" />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-yellow/25 bg-[#0b0b0b] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="relative px-5 pb-6 pt-7 md:px-8 md:pt-9">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow">
                  Token access
                </p>
                <h1 className="mt-3 text-[44px] font-semibold leading-none tracking-tight md:text-[64px]">
                  $<span className="text-yellow">GENER8</span>
                </h1>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
                  Hold {formatTokenBalance(minHold)} or more in the wallet you connect.
                  Under that, Generate stays closed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                    className="inline-flex h-12 items-center rounded-full border border-yellow/35 px-5 text-[15px] font-semibold text-yellow hover:bg-yellow/10"
                  >
                    BUY $GENER8
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/8 md:grid-cols-3">
            {TOKEN_GATING.tiers.map((tier) => {
              const studio = tier.id === 3;
              const yours = currentTierId === tier.id;
              return (
                <article
                  key={tier.id}
                  className={cn(
                    "relative px-5 py-6 md:px-6 md:py-7",
                    studio ? "bg-[#16140a]" : "bg-transparent",
                    tier.id > 1 && "border-t border-white/8 md:border-l md:border-t-0",
                  )}
                >
                  {studio &&
                    SPARKS.map((spark) => (
                      <motion.span
                        key={`${spark.left}-${spark.top}`}
                        aria-hidden
                        className="pointer-events-none absolute rounded-full bg-yellow shadow-[0_0_8px_#fff176]"
                        style={{
                          left: spark.left,
                          top: spark.top,
                          width: spark.size,
                          height: spark.size,
                        }}
                        animate={{ opacity: [0.15, 1, 0.15], scale: [0.5, 1.2, 0.5] }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          delay: spark.delay,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow">
                      {tier.label}
                    </p>
                    {yours ? (
                      <span className="rounded-full bg-yellow px-2 py-0.5 text-[10px] font-bold text-ink">
                        Your tier
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "mt-4 font-semibold leading-none tracking-tight",
                      studio ? "text-[40px] text-yellow" : "text-[32px] text-white",
                    )}
                  >
                    {formatTokenBalance(tier.minimumBalance)}
                  </p>
                  <p className="mt-3 text-[15px] font-semibold text-white">
                    {studio ? <Unlimited /> : rateLabel(tier.hourlyGenerations)}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                    {studio
                      ? "No hourly cap. One video at a time."
                      : "One video at a time."}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <ViralLoop />
    </div>
  );
}

const FLOW = [
  { kicker: "01", title: "Connect", body: STEPS[0].body, arrow: "right" as const },
  { kicker: "02", title: "Hold", body: STEPS[1].body, arrow: "right" as const },
  { kicker: "03", title: "Create", body: STEPS[2].body, arrow: "down" as const },
  { kicker: "06", title: "Rewards", body: LOOP[0].body, arrow: "up" as const },
  { kicker: "05", title: "Fees", body: LOOP[1].body, arrow: "left" as const },
  { kicker: "04", title: "Spread", body: LOOP[2].body, arrow: "left" as const },
];

function ViralLoop() {
  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-yellow/25 bg-[#0b0b0b] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="grid md:grid-cols-3">
        {FLOW.map((item, index) => (
          <article
            key={item.title}
            className={cn(
              "relative px-5 py-6 md:px-6 md:py-7",
              index % 3 !== 0 && "md:border-l md:border-white/8",
              index >= 3 && "border-t border-white/8",
              index > 0 && "max-md:border-t max-md:border-white/8",
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow">
              {item.kicker}
            </p>
            <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-white">
              {item.title}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-white/50">{item.body}</p>
            <FlowArrow direction={item.arrow} />
          </article>
        ))}
      </div>
    </section>
  );
}

function FlowArrow({ direction }: { direction: "right" | "left" | "down" | "up" }) {
  const place = {
    right: "right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block",
    left: "left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block",
    down: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    up: "left-1/2 top-0 hidden -translate-x-1/2 -translate-y-1/2 md:block",
  }[direction];
  const turn = { right: "", down: "rotate-90", left: "rotate-180", up: "-rotate-90" }[direction];
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("pointer-events-none absolute z-10 h-5 w-5 text-yellow", place, turn)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
    >
      <path d="M4 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Unlimited() {
  return (
    <span className="relative inline-block text-yellow">
      Unlimited
      <motion.span
        aria-hidden
        className="absolute -right-2 -top-1 h-1 w-1 rounded-full bg-yellow shadow-[0_0_6px_#fff176]"
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.3, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}
