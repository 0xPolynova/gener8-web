"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, Plus, Sparkles, Settings2, ChevronDown, Shuffle, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppState } from "@/components/providers/AppState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { KolPicker } from "./KolPicker";

interface OmniMedia {
  id: string;
  type: "image" | "video";
  localUrl: string;
  uploadedUrl: string | null;
  label: string;
  uploading: boolean;
}

interface OmniSettings {
  ratio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  duration: number;
}

interface RemixVideo {
  url: string;
  thumbnailUrl: string | null;
  duration: number;
  title: string;
  id: string;
  label: string;
}

const RATIOS: OmniSettings["ratio"][] = ["16:9", "4:3", "1:1", "3:4", "9:16"];

let imgSeq = 0;
let vidSeq = 0;

function nextLabel(type: "image" | "video") {
  return type === "image" ? `Image${++imgSeq}` : `Video${++vidSeq}`;
}

function remixTemplate(videoLabel: string): string {
  return (
    `@${videoLabel} replace the characters in this video with these characters. ` +
    `This video must be exactly like @${videoLabel} — do not change anything but the characters, ` +
    `keeping their lipsync and motion. The framing, cutaways, camera angles, and video composition ` +
    `must stay exactly the same. Never swap character placement; all characters stay in the same ` +
    `position throughout the entire video.`
  );
}

export function OmniBox() {
  const { session, eligibility } = useAppState();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<OmniMedia[]>([]);
  const [remix, setRemix] = useState<RemixVideo | null>(null);
  const [settings, setSettings] = useState<OmniSettings>({ ratio: "16:9", duration: 15 });
  const [showSettings, setShowSettings] = useState(false);
  const [showKols, setShowKols] = useState(false);
  const [selectedKols, setSelectedKols] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const remaining = eligibility?.remainingToday ?? eligibility?.dailyLimit ?? 0;

  /* Close settings on outside click */
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettings]);

  /* Listen for remix events */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        videoUrl: string;
        thumbnailUrl: string | null;
        duration: number;
        title: string;
        id: string;
      };
      const label = nextLabel("video");
      const remixData: RemixVideo = {
        url: detail.videoUrl,
        thumbnailUrl: detail.thumbnailUrl,
        duration: detail.duration,
        title: detail.title,
        id: detail.id,
        label,
      };
      setRemix(remixData);
      setSettings((s) => ({ ...s, duration: detail.duration }));
      setPrompt(remixTemplate(label));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      }, 80);
    };
    window.addEventListener("omni:remix", handler);
    return () => window.removeEventListener("omni:remix", handler);
  }, []);

  const clearRemix = () => {
    setRemix(null);
    setPrompt("");
  };

  const toggleKol = (handle: string) => {
    const ref = `@${handle}`;
    setSelectedKols((prev) => {
      const next = prev.includes(handle)
        ? prev.filter((h) => h !== handle)
        : [...prev, handle];

      // Keep prompt @mentions in sync
      if (prev.includes(handle)) {
        // remove it from prompt
        setPrompt((p) =>
          p
            .replace(new RegExp(`\\s*${ref}\\b`, "g"), "")
            .replace(new RegExp(`\\b${ref}\\s*`, "g"), "")
            .trim(),
        );
      } else {
        // append to prompt
        setPrompt((p) => (p ? `${p} ${ref}` : ref));
      }
      return next;
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const newItems: OmniMedia[] = [];

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) continue;

        const label = nextLabel(isVideo ? "video" : "image");
        const item: OmniMedia = {
          id: crypto.randomUUID(),
          type: isVideo ? "video" : "image",
          localUrl: URL.createObjectURL(file),
          uploadedUrl: null,
          label,
          uploading: true,
        };
        newItems.push(item);
        setMedia((prev) => [...prev, item]);

        const form = new FormData();
        form.append("file", file);
        try {
          const res = await apiFetch("/api/refs", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Upload failed");
          setMedia((prev) =>
            prev.map((m) =>
              m.id === item.id ? { ...m, uploadedUrl: data.url, uploading: false } : m,
            ),
          );
        } catch {
          toast(`Couldn't upload ${file.name}`, "error");
          setMedia((prev) => prev.filter((m) => m.id !== item.id));
          URL.revokeObjectURL(item.localUrl);
        }
      }

      /* Append @Label references to the prompt */
      if (newItems.length > 0) {
        const refs = newItems.map((m) => `@${m.label}`).join(" ");
        setPrompt((p) => (p ? `${p} ${refs}` : refs));
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    },
    [toast],
  );

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) URL.revokeObjectURL(item.localUrl);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!session) { toast("Connect your wallet to generate.", "error"); return; }
    const trimmed = prompt.trim();
    if (!trimmed) { toast("Write a prompt first.", "error"); return; }
    if (media.some((m) => m.uploading)) { toast("Wait for uploads to finish.", "error"); return; }

    setSubmitting(true);
    try {
      const omniAssets = media
        .filter((m) => m.uploadedUrl)
        .map((m) => ({ type: m.type, url: m.uploadedUrl!, name: m.label }));

      const res = await apiFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: trimmed,
          omniAssets,
          referenceVideoUrl: remix?.url ?? null,
          visibility: "public",
          settings: {
            model: "wan3.0-video",
            aspectRatio: settings.ratio,
            duration: settings.duration,
            quality: "standard",
            negativePrompt: "",
            seed: null,
            cameraMovement: "static",
            promptAdherence: 70,
            creativity: 50,
            publicPrompt: true,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast(data.error ?? "Generation failed.", "error"); return; }

      toast("Generating… this takes ~60s. Check My Creations.", "success");
      setPrompt("");
      setMedia([]);
      setRemix(null);
      setSelectedKols([]);
      imgSeq = 0;
      vidSeq = 0;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't start generation.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const durationLocked = remix !== null;

  return (
    <>
    <div
      ref={containerRef}
      className="fixed bottom-[calc(56px+0.75rem)] md:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-3xl"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/20 via-fuchsia-400/20 to-yellow/20 animate-glow blur-lg" />
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-white/8" />

      <div className="omni-box relative rounded-2xl bg-ink/92 backdrop-blur-xl overflow-hidden shadow-2xl">

        {/* Settings panel */}
        {showSettings && (
          <div className="border-b border-white/6 px-4 py-3 space-y-3 animate-rise">
            <div className="flex gap-1.5 flex-wrap">
              {RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSettings((s) => ({ ...s, ratio: r }))}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors",
                    settings.ratio === r
                      ? "bg-yellow text-ink"
                      : "border border-white/10 text-white/70 hover:text-white",
                  )}
                >{r}</button>
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-[12px] text-white/50">
                Duration — {settings.duration}s
                {durationLocked && <span className="ml-2 text-yellow/70">locked to remix</span>}
              </p>
              <input
                type="range" min={2} max={30} step={1} value={settings.duration}
                disabled={durationLocked}
                onChange={(e) => setSettings((s) => ({ ...s, duration: Number(e.target.value) }))}
                className={cn("w-full accent-yellow focus:outline-none", durationLocked && "opacity-40 cursor-not-allowed")}
              />
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
          <button className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium text-white bg-elevated hover:bg-white/10 transition-colors">
            Omni <ChevronDown className="h-3 w-3 text-white/40" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[12px] font-medium text-white/60">
              <span className="h-2 w-2 rounded-full border border-violet-400/60 bg-violet-500/20" />
              Wan3.0
            </div>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-1 text-[12px] font-medium transition-colors",
                showSettings ? "border-yellow/40 text-yellow" : "border-white/10 text-white/60 hover:text-white",
              )}
            >
              {settings.ratio} <span className="text-white/20">|</span> {settings.duration}s
              <Settings2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Remix card — thumbnail preview */}
        {remix && (
          <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-xl border border-yellow/20 bg-yellow/5 p-2">
            {/* Thumbnail */}
            <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink">
              {remix.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={remix.thumbnailUrl} alt={remix.title} className="h-full w-full object-cover" />
              ) : (
                <video src={remix.url} className="h-full w-full object-cover" muted playsInline />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Shuffle className="h-3.5 w-3.5 text-yellow" />
              </div>
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-yellow/80 uppercase tracking-wide">Remixing</p>
                <span className="rounded px-1 py-0.5 text-[11px] font-mono font-medium text-yellow bg-yellow/15">@{remix.label}</span>
              </div>
              <p className="truncate text-[13px] font-medium text-white leading-snug mt-0.5">{remix.title}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{remix.duration}s · duration locked</p>
            </div>
            {/* Dismiss */}
            <button
              onClick={clearRemix}
              className="flex-shrink-0 rounded-full p-1 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Prompt textarea */}
        <div className="px-3 pb-1">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            placeholder={session ? "Describe what you want to generate… (⌘↵ to send)" : "Connect your wallet to start creating"}
            disabled={!session || submitting}
            rows={2}
            className="w-full resize-none border-0 bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:ring-0 disabled:opacity-40"
          />
        </div>

        {/* Bottom bar — thumbnails + controls */}
        <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
            {/* Selected KOL chips */}
            {selectedKols.map((handle) => (
              <span
                key={handle}
                className="inline-flex items-center gap-1 rounded-full border border-yellow/30 bg-yellow/10 px-2 py-0.5 text-[11px] font-medium text-yellow flex-shrink-0"
              >
                @{handle}
                <button onClick={() => toggleKol(handle)} className="opacity-60 hover:opacity-100">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {/* Media thumbnails */}
            {media.map((item) => (
              <div key={item.id} className="group/thumb relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                {item.type === "video" ? (
                  <video src={item.localUrl} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.localUrl} alt={item.label} className="h-full w-full object-cover" />
                )}
                {item.uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-yellow border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="absolute inset-0 flex items-center justify-center bg-ink/70 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    aria-label={`Remove ${item.label}`}
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>
            ))}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
            />
            {/* Media button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!session || submitting}
              className="flex h-8 items-center gap-1 flex-shrink-0 rounded-lg border border-dashed border-white/20 px-2 text-[12px] font-medium text-white/50 hover:border-white/40 hover:text-white transition-colors disabled:opacity-40"
            >
              <Plus className="h-3 w-3" /> Media
            </button>
            {/* KOLs button */}
            <button
              onClick={() => setShowKols(true)}
              disabled={!session || submitting}
              className={cn(
                "flex h-8 items-center gap-1 flex-shrink-0 rounded-lg border px-2 text-[12px] font-medium transition-colors disabled:opacity-40",
                selectedKols.length > 0
                  ? "border-yellow/40 bg-yellow/10 text-yellow"
                  : "border-dashed border-white/20 text-white/50 hover:border-white/40 hover:text-white",
              )}
            >
              <Users className="h-3 w-3" /> KOLs
              {selectedKols.length > 0 && (
                <span className="ml-0.5 rounded-full bg-yellow px-1 text-[10px] font-bold text-ink">
                  {selectedKols.length}
                </span>
              )}
            </button>
          </div>

          <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-[14px] font-semibold text-white/40 hover:text-white transition-colors">
            @
          </button>

          <button
            onClick={handleSubmit}
            disabled={!session || submitting || !prompt.trim()}
            className={cn(
              "flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-all",
              session && prompt.trim() && !submitting
                ? "bg-yellow text-ink hover:bg-yellow-bright shadow-[0_0_12px_rgba(255,241,118,0.25)]"
                : "bg-elevated text-white/30 cursor-not-allowed",
            )}
          >
            {submitting
              ? <span className="h-3 w-3 rounded-full border-2 border-ink/40 border-t-ink animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />}
            {remaining > 0 ? remaining : ""}
          </button>
        </div>
      </div>
    </div>

    <KolPicker
      open={showKols}
      selected={selectedKols}
      onToggle={toggleKol}
      onClose={() => setShowKols(false)}
    />
  </>;
}
