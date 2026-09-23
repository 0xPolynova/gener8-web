"use client";

import { motion } from "framer-motion";
import { BRAND_ASSETS } from "@/lib/config/cdn";

const SLICES = [
  { clip: "polygon(0% 0%, 100% 0%, 100% 30%, 0% 44%)", shift: 8 },
  { clip: "polygon(0% 48%, 100% 34%, 100% 70%, 0% 82%)", shift: -10 },
  { clip: "polygon(0% 86%, 100% 74%, 100% 100%, 0% 100%)", shift: 6 },
];

export function GeneratingPoster() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070705]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 100%, rgba(255,255,255,0.03), transparent 46%), linear-gradient(180deg, #0c0c0a 0%, #070705 100%)",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-[42%] h-24 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,236,140,0.55) 0%, rgba(214,168,42,0.18) 42%, transparent 72%)",
        }}
        animate={{ opacity: [0.35, 0.7, 0.4], scale: [0.92, 1.06, 0.94] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative flex h-full flex-col items-center justify-center">
        <div className="relative h-[72px] w-14">
          {SLICES.map((slice, index) => (
            <motion.img
              key={slice.clip}
              src={BRAND_ASSETS.logo}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              style={{ clipPath: slice.clip }}
              animate={{ x: [0, 0, slice.shift, 0, 0, -slice.shift * 0.5, 0] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.7, 0.74, 0.78, 0.9, 0.94, 1],
                delay: index * 0.05,
              }}
            />
          ))}
        </div>
        <motion.p
          className="relative mt-4 text-[13px] font-bold tracking-[0.18em] text-white"
          animate={{ opacity: [0.4, 1, 0.45] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          generating
        </motion.p>
      </div>
    </div>
  );
}
