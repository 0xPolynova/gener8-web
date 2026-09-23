"use client";

import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";

const SPARKS = [
  { left: "8%", top: "-7px", delay: 0 },
  { left: "38%", top: "-5px", delay: 0.35 },
  { left: "70%", top: "110%", delay: 0.15 },
  { left: "92%", top: "-4px", delay: 0.55 },
  { left: "54%", top: "115%", delay: 0.7 },
];

function Unlimited() {
  return (
    <span className="relative inline-block px-1 font-semibold text-yellow">
      unlimited generations
      {SPARKS.map((spark) => (
        <motion.span
          key={`${spark.left}-${spark.top}`}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-yellow shadow-[0_0_6px_#fff176]"
          style={{ left: spark.left, top: spark.top }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: spark.delay, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export function HoldGate({
  open,
  onClose,
  mint,
}: {
  open: boolean;
  onClose: () => void;
  mint: string | null;
}) {
  const href = mint ? `https://jup.ag/tokens/${mint}` : null;
  return (
    <Modal open={open} onClose={onClose} className="max-w-sm p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow">$GENER8</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Hold to remix</h2>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        <li>
          <span className="font-bold text-white">50,000</span> held for 1 generation an hour.
        </li>
        <li>
          <span className="font-bold text-white">100,000</span> held for 3 generations an hour.
        </li>
        <li>
          <span className="font-bold text-white">300,000</span> held for <Unlimited />.
        </li>
      </ul>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex h-11 items-center justify-center rounded-xl bg-yellow text-sm font-semibold text-ink hover:bg-yellow-bright"
        >
          BUY $GENER8
        </a>
      ) : (
        <p className="mt-6 text-sm text-muted">The token link is not configured yet.</p>
      )}
    </Modal>
  );
}
