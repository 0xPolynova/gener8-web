"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export interface Kol {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

let extraKols: Kol[] = [];

export function rememberKols(kols: Kol[]) {
  extraKols = kols;
}

export function findKol(handle: string) {
  return extraKols.find((kol) => kol.handle === handle) ?? KOLS.find((kol) => kol.handle === handle);
}

export const KOLS: Kol[] = [
  // Row 1
  { id: "banks",    name: "Banks",       handle: "Banks",          avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/843b3e0f-0cae-45cd-1b65-dc2fd1759d00/public" },
  { id: "orangie",  name: "Orangie",     handle: "orangie",        avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b0fe919a-2c56-449c-f575-200ea6294100/public" },
  { id: "rasmr",    name: "RasmR",       handle: "rasmr",          avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/9c47feba-735f-48e2-97a1-4549866feb00/public" },
  { id: "tjr",      name: "TJR",         handle: "TJR",            avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/b079d19a-8290-4b3a-604d-b88fd6de7a00/public" },
  { id: "frank",    name: "Frank De Gods", handle: "FrankDeGods", avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/a007dc78-6c50-412c-07d2-93c05ae37a00/public" },
  // Row 2
  { id: "brez",     name: "Brez Scales", handle: "BrezScales",  avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/bc5c8e5a-46f7-4618-e89f-33d609bd9900/public" },
  { id: "ansem",    name: "Ansem",       handle: "blknoiz06",   avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/f131fe97-f895-4a1e-b14d-2a3b4f583f00/public" },
  { id: "kimchi",   name: "Kimchi",      handle: "Kimchi",      avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/39fcfe69-c1c6-486b-cf0f-f024af66e500/public" },
  { id: "jack",     name: "Jack Duval",  handle: "JackDuval",   avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/e548f9b8-7432-4559-edbb-e0754c598600/public" },
  { id: "alx",      name: "Alxcooks",    handle: "alxcooks",    avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/e063ae32-5fc7-4a59-b2ca-544c5e50e200/public" },
  // Row 3
  { id: "threadguy", name: "ThreadGuy",  handle: "ThreadGuy",   avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/e3a03dfe-2256-4e0e-2578-65520e7b1900/public" },
  { id: "togi",     name: "Togi",        handle: "Togi",          avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/0581ad77-069b-410f-335c-88cf1819a100/public" },
  { id: "steve",    name: "SteveWillDoIt", handle: "SteveWillDoIt", avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/c8435d56-b3c3-47fa-74cf-b0351b0a7900/public" },
  { id: "seyong",   name: "Seyong",      handle: "Seyong",        avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/5d2e420a-cf41-495a-bae3-13265b8ecd00/public" },
  { id: "odablock", name: "Odablock",    handle: "Odablock",      avatar: "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/f475cda1-cb5a-42ff-d8c6-ce3674270b00/public" },
];

interface KolPickerProps {
  open: boolean;
  selected: string[];
  onToggle: (handle: string) => void;
  onStyle: (kol: Kol, mode: "new" | "community") => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

function StyleButton({ onPick }: { onPick: (mode: "new" | "community") => void }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ bottom: 0, left: 0 });

  const place = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ bottom: window.innerHeight - rect.top, left: rect.left });
  };

  const closeIfLeft = (event: { relatedTarget: EventTarget | null }) => {
    const next = event.relatedTarget as Node | null;
    if (anchorRef.current?.contains(next) || menuRef.current?.contains(next)) return;
    setOpen(false);
  };

  return (
    <div
      ref={anchorRef}
      className="absolute left-1.5 top-1.5 z-10"
      onMouseEnter={() => {
        place();
        setOpen(true);
      }}
      onMouseLeave={closeIfLeft}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="rounded-md bg-yellow px-1.5 py-0.5 text-[11px] font-semibold text-ink"
      >
        Style
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                id="style-hover-menu"
                className="fixed z-[28] flex flex-col gap-1 pb-1"
                style={{ bottom: pos.bottom, left: pos.left }}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                onMouseLeave={closeIfLeft}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onPick("new")}
                  className="whitespace-nowrap rounded-md bg-[#ffe9a3] px-1.5 py-0.5 text-left text-[11px] font-semibold text-ink"
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={() => onPick("community")}
                  className="whitespace-nowrap rounded-md bg-[#f3d36a] px-1.5 py-0.5 text-left text-[11px] font-semibold text-ink"
                >
                  Community styles
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export function KolPicker({ open, selected, onToggle, onStyle, onClose, anchorRef }: KolPickerProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const newKolRef = useRef<HTMLButtonElement>(null);
  const [newKolTip, setNewKolTip] = useState<{ top: number; left: number } | null>(null);
  const [library, setLibrary] = useState<Kol[]>([]);
  const [draft, setDraft] = useState<{ file: File; preview: string } | null>(null);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [bottom, setBottom] = useState(200);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchorRef?.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setBottom(Math.max(16, window.innerHeight - rect.top + 10));
    };
    place();
    const observed = anchorRef?.current;
    const observer = new ResizeObserver(place);
    if (observed) observer.observe(observed);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) {
      setNewKolTip(null);
      return;
    }
    let cancelled = false;
    apiFetch("/api/kols")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const kols = (data.kols ?? []) as Kol[];
        rememberKols(kols);
        setLibrary(kols);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open]);

  const submitKol = async () => {
    if (!draft || name.trim().length < 2) {
      toast("Add the KOL’s name.", "error");
      return;
    }
    setSending(true);
    try {
      const body = new FormData();
      body.set("file", draft.file);
      body.set("name", name.trim());
      const res = await apiFetch("/api/kols", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn’t send that KOL.");
      toast("Sent for approval.", "success");
      URL.revokeObjectURL(draft.preview);
      setDraft(null);
      setName("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn’t send that KOL.", "error");
    } finally {
      setSending(false);
    }
  };

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
            className="fixed inset-x-0 z-[21] mx-auto w-[calc(100%-0.5rem)] max-w-3xl px-0"
            style={{ bottom }}
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
                <button
                  ref={newKolRef}
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={() => {
                    const rect = newKolRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    setNewKolTip({ top: rect.top, left: rect.left + rect.width / 2 });
                  }}
                  onMouseLeave={() => setNewKolTip(null)}
                  className="group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/30 bg-white/[0.03] text-center transition-colors hover:border-yellow/80 hover:bg-yellow/10"
                >
                  <span className="pointer-events-none absolute text-7xl font-light leading-none text-white/15">+</span>
                  <span className="relative flex flex-col items-center text-[13px] font-semibold leading-tight text-white">
                    <span>SUBMIT</span>
                    <span>NEW KOL</span>
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      setDraft({ file, preview: URL.createObjectURL(file) });
                    }}
                  />
                </button>
                {[...KOLS, ...library].map((kol) => {
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
                        "group relative w-full aspect-square overflow-hidden rounded-xl transition-all duration-150 cursor-pointer ring-2 ring-inset ring-transparent hover:ring-white/45",
                        isSelected ? "ring-yellow/70 hover:ring-yellow/70" : "",
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
                    const kol = findKol(handle);
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
              {draft && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-6">
                  <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-surface p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draft.preview} alt="" className="mx-auto h-28 w-28 rounded-xl object-cover" />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="KOL name"
                      className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white"
                        onClick={() => {
                          URL.revokeObjectURL(draft.preview);
                          setDraft(null);
                          setName("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={sending}
                        className="flex-1 rounded-lg bg-yellow py-2 text-sm font-semibold text-ink"
                        onClick={() => void submitKol()}
                      >
                        {sending ? "Sending…" : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
      {newKolTip && (
        <div
          className="pointer-events-none fixed z-[32] w-56 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-left text-[12px] leading-snug text-white shadow-xl"
          style={{ top: newKolTip.top - 8, left: newKolTip.left }}
        >
          This permanently adds a new KOL and needs admin approval. Use upload media to add a character immediately.
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
