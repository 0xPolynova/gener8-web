"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Kol } from "./KolPicker";

interface StylePickerProps {
  kol: Kol | null;
  session: number;
  onClose: () => void;
  onPick: (url: string) => void;
}

export function StylePicker({ kol, session, onClose, onPick }: StylePickerProps) {
  const [style, setStyle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    requestRef.current += 1;
    setStyle("");
    setImages([]);
    setBusy(false);
    setError(null);
  }, [kol?.id, session]);

  if (typeof document === "undefined") return null;

  const generate = async () => {
    if (!kol || busy) return;
    const phrase = style.trim();
    if (phrase.length < 2) {
      setError("Describe the clothing style first.");
      return;
    }
    const requestId = ++requestRef.current;
    setBusy(true);
    setError(null);
    setImages([]);
    try {
      const res = await apiFetch("/api/styles", {
        method: "POST",
        body: JSON.stringify({ imageUrl: kol.avatar, style: phrase }),
      });
      const data = await res.json();
      if (requestRef.current !== requestId) return;
      if (!res.ok) throw new Error(data.error ?? "Couldn’t generate styles.");
      const urls = (data.images as { url: string }[] | undefined)?.map((item) => item.url) ?? [];
      if (!urls.length) throw new Error("No images came back.");
      setImages(urls);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Couldn’t generate styles.");
    } finally {
      if (requestRef.current === requestId) setBusy(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {kol && (
        <>
          <motion.div
            key="style-backdrop"
            className="fixed inset-0 z-[22] bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="style-panel"
            id="style-picker-panel"
            className="fixed inset-x-0 top-[4.75rem] z-[23] mx-auto w-[calc(100%-2rem)] max-h-[calc(100vh-4.75rem-10.5rem)] max-w-3xl overflow-y-auto"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-surface/95 shadow-[0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/6 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">Style · {kol.name}</p>
                  <p className="text-[11px] text-white/40">10 full-length 9:16 looks from this photo</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-full p-1.5 text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2 px-3 py-2">
                <input
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void generate();
                    }
                  }}
                  placeholder="urban style, vibe, chain, sneakers"
                  className="h-9 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void generate()}
                  disabled={busy}
                  className="h-9 rounded-lg bg-yellow px-3 text-[13px] font-semibold text-ink disabled:opacity-50"
                >
                  {busy ? "Generating…" : "Generate"}
                </button>
              </div>

              {error && <p className="px-3 pb-2 text-[12px] text-red-300">{error}</p>}

              <div className="grid grid-cols-5 gap-1 p-1.5">
                {(busy ? Array.from({ length: 10 }, () => "") : images).map((url, index) =>
                  url ? (
                    <button
                      key={url}
                      type="button"
                      onClick={() => onPick(url)}
                      className="relative aspect-[9/16] overflow-hidden rounded-lg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <div
                      key={`slot-${index}`}
                      className="flex aspect-[9/16] items-center justify-center rounded-lg bg-white/8"
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                    </div>
                  ),
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
