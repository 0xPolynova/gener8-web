"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Kol {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

export const KOLS: Kol[] = [
  // Row 1
  { id: "banks",    name: "Banks",       handle: "Banks",          avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/843b3e0f-0cae-45cd-1b65-dc2fd1759d00/public" },
  { id: "orangie",  name: "Orangie",     handle: "orangie",        avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b0fe919a-2c56-449c-f575-200ea6294100/public" },
  { id: "rasmr",    name: "RasmR",       handle: "rasmr",          avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/9c47feba-735f-48e2-97a1-4549866feb00/public" },
  { id: "tjr",      name: "TJR",         handle: "TJR",            avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b079d19a-8290-4b3a-604d-b88fd6de7a00/public" },
  { id: "ansem",    name: "Ansem",       handle: "blknoiz06",      avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/843b3e0f-0cae-45cd-1b65-dc2fd1759d00/public" },
  // Row 2
  { id: "hsaka",    name: "Hsaka",       handle: "HsakaTrades",    avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b0fe919a-2c56-449c-f575-200ea6294100/public" },
  { id: "cobie",    name: "Cobie",       handle: "cobie",          avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/9c47feba-735f-48e2-97a1-4549866feb00/public" },
  { id: "arthur",   name: "Arthur Hayes","handle": "CryptoHayes",  avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b079d19a-8290-4b3a-604d-b88fd6de7a00/public" },
  { id: "gcr",      name: "GCR",         handle: "GiganticRebirth",avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/843b3e0f-0cae-45cd-1b65-dc2fd1759d00/public" },
  { id: "zach",     name: "ZachXBT",     handle: "zachxbt",        avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b0fe919a-2c56-449c-f575-200ea6294100/public" },
  // Row 3
  { id: "pentoshi", name: "Pentoshi",    handle: "Pentosh1",       avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/9c47feba-735f-48e2-97a1-4549866feb00/public" },
  { id: "miles",    name: "Miles D",     handle: "milesdeutscher", avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b079d19a-8290-4b3a-604d-b88fd6de7a00/public" },
  { id: "gainzy",   name: "Gainzy",      handle: "gainzyXBT",      avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/843b3e0f-0cae-45cd-1b65-dc2fd1759d00/public" },
  { id: "light",    name: "Light",       handle: "LightCrypto",    avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b0fe919a-2c56-449c-f575-200ea6294100/public" },
  { id: "nftbird",  name: "NFTbird",     handle: "nftbird",        avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/9c47feba-735f-48e2-97a1-4549866feb00/public" },
  // Row 4
  { id: "cobain",   name: "CryptoCobain","handle":"CryptoCobain",  avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b079d19a-8290-4b3a-604d-b88fd6de7a00/public" },
  { id: "kaleo",    name: "Kaleo",       handle: "CryptoKaleo",    avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/843b3e0f-0cae-45cd-1b65-dc2fd1759d00/public" },
  { id: "murad",    name: "Murad",       handle: "MuradMahmudov",  avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b0fe919a-2c56-449c-f575-200ea6294100/public" },
  { id: "degen",    name: "DegenSpartan","handle":"DegenSpartan",   avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/9c47feba-735f-48e2-97a1-4549866feb00/public" },
  { id: "luma",     name: "LUma",        handle: "luma__JOkl",     avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b079d19a-8290-4b3a-604d-b88fd6de7a00/public" },
];

interface KolPickerProps {
  open: boolean;
  selected: string[];
  onToggle: (handle: string) => void;
  onStyle: (kol: Kol, mode: "new" | "community") => void;
  onClose: () => void;
}

function StyleButton({ onPick }: { onPick: (mode: "new" | "community") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="absolute left-1.5 top-1.5 z-10"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-full left-0 flex flex-col gap-1 pb-1"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <button
              type="button"
              onClick={() => onPick("new")}
              className="whitespace-nowrap rounded-md bg-[#ffe9a3] px-1.5 py-0.5 text-[11px] font-semibold text-ink"
            >
              New
            </button>
            <button
              type="button"
              onClick={() => onPick("community")}
              className="whitespace-nowrap rounded-md bg-[#f3d36a] px-1.5 py-0.5 text-[11px] font-semibold text-ink"
            >
              Community styles
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        className="rounded-md bg-yellow px-1.5 py-0.5 text-[11px] font-semibold text-ink"
      >
        Style
      </button>
    </div>
  );
}

export function KolPicker({ open, selected, onToggle, onStyle, onClose }: KolPickerProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Dim backdrop — z-20, below OmniBox at z-30 */}
          <motion.div
            key="kol-backdrop"
            className="fixed inset-0 z-20 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Grid panel — z-[21], centered, above backdrop, below OmniBox */}
          <motion.div
            key="kol-panel"
            id="kol-picker-panel"
            className="fixed inset-x-0 bottom-[15.5rem] md:bottom-[12.5rem] z-[21] mx-auto w-[calc(100%-2rem)] max-w-3xl px-0"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {/* Glow halo behind the whole grid */}
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-600/25 via-fuchsia-500/15 to-yellow/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-surface/90 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/6 px-3 py-2">
                <div>
                  <p className="text-[13px] font-semibold text-white">KOLs</p>
                  <p className="text-[11px] text-white/40">Select to add @mention to your prompt</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Grid 3×6 */}
              <div className="grid grid-cols-6 gap-1 p-1.5">
                {KOLS.map((kol) => {
                  const isSelected = selected.includes(kol.handle);
                  return (
                    <motion.div
                      key={kol.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onToggle(kol.handle)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggle(kol.handle);
                        }
                      }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "group relative w-full aspect-square overflow-hidden rounded-xl transition-all duration-150 cursor-pointer",
                        isSelected ? "ring-2 ring-inset ring-yellow/70" : "",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={kol.avatar}
                        alt={kol.name}
                        className="h-full w-full object-cover"
                      />

                      <StyleButton onPick={(mode) => onStyle(kol, mode)} />

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5">
                          <Check className="h-4 w-4 text-yellow drop-shadow" strokeWidth={2.5} />
                        </div>
                      )}

                      {/* Name label — bottom-left with generous gradient bg */}
                      <div className="absolute bottom-0 left-0 right-0 px-2 pt-6 pb-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <p className={cn(
                          "truncate text-left text-[13px] font-semibold leading-tight drop-shadow",
                          isSelected ? "text-yellow" : "text-white",
                        )}>{kol.name}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Selected chips footer */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-white/6 px-3 py-2.5">
                  {selected.map((handle) => {
                    const kol = KOLS.find((k) => k.handle === handle);
                    return (
                      <span
                        key={handle}
                        className="inline-flex items-center gap-1 rounded-full border border-yellow/30 bg-yellow/10 px-2 py-0.5 text-[11px] font-medium text-yellow"
                      >
                        @{handle}
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggle(handle); }}
                          className="ml-0.5 opacity-60 hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
