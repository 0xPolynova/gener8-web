"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, Plus, Sparkles, Settings2, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppState } from "@/components/providers/AppState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

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

const RATIOS: OmniSettings["ratio"][] = ["16:9", "4:3", "1:1", "3:4", "9:16"];

let imgSeq = 0;
let vidSeq = 0;

function nextLabel(type: "image" | "video") {
  return type === "image" ? `Image ${++imgSeq}` : `Video ${++vidSeq}`;
}

export function OmniBox() {
  const { session, eligibility } = useAppState();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<OmniMedia[]>([]);
  const [settings, setSettings] = useState<OmniSettings>({ ratio: "16:9", duration: 15 });
  const [showSettings, setShowSettings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const remaining = eligibility?.remainingToday ?? eligibility?.dailyLimit ?? 0;

  /* Close settings on click outside */
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

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const newItems: OmniMedia[] = [];

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) continue;

        const item: OmniMedia = {
          id: crypto.randomUUID(),
          type: isVideo ? "video" : "image",
          localUrl: URL.createObjectURL(file),
          uploadedUrl: null,
          label: nextLabel(isVideo ? "video" : "image"),
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

      const labels = newItems.map((m) => m.label).join(", ");
      if (labels) {
        setPrompt((p) => (p ? `${p} ${labels}` : labels));
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
      imgSeq = 0;
      vidSeq = 0;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't start generation.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-[calc(56px+0.75rem)] md:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-3xl"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/20 via-fuchsia-400/20 to-yellow/20 animate-glow blur-lg" />
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-white/8" />

      <div className="omni-box relative rounded-2xl bg-ink/92 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Settings panel — slides in above the top bar */}
        {showSettings && (
          <div className="border-b border-white/6 px-4 py-3 space-y-3 animate-rise">
            {/* Aspect ratio */}
            <div className="flex gap-1.5 flex-wrap">
              {RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSettings((s) => ({ ...s, ratio: r }))}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
                    settings.ratio === r
                      ? "bg-yellow text-ink"
                      : "border border-white/10 text-muted hover:text-paper",
                  )}
                >{r}</button>
              ))}
            </div>
            {/* Duration */}
            <div>
              <p className="mb-1.5 text-[11px] text-muted">Duration — {settings.duration}s</p>
              <input
                type="range" min={2} max={30} step={1} value={settings.duration}
                onChange={(e) => setSettings((s) => ({ ...s, duration: Number(e.target.value) }))}
                className="w-full accent-yellow focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
          <button className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium text-paper bg-elevated hover:bg-white/10 transition-colors">
            Omni <ChevronDown className="h-3 w-3 text-muted" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-medium text-muted">
              <span className="h-2 w-2 rounded-full border border-violet-400/60 bg-violet-500/20" />
              Wan3.0
            </div>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors",
                showSettings
                  ? "border-yellow/40 text-yellow"
                  : "border-white/10 text-muted hover:text-paper",
              )}
            >
              {settings.ratio} <span className="text-white/20">|</span> {settings.duration}s
              <Settings2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Media chips */}
        {media.length > 0 && (
          <div className="px-3 pb-1 flex flex-wrap gap-1.5">
            {media.map((item) => (
              <span key={item.id} className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                item.type === "video"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                  : "bg-violet-500/15 text-violet-300 border border-violet-500/25",
              )}>
                {item.type === "video" ? (
                  <video src={item.localUrl} className="h-3.5 w-5 rounded object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.localUrl} alt={item.label} className="h-3.5 w-3.5 rounded object-cover" />
                )}
                {item.uploading ? <span className="animate-pulse">{item.label}…</span> : item.label}
                <button onClick={() => removeMedia(item.id)} className="opacity-60 hover:opacity-100">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Prompt */}
        <div className="px-3 pb-1">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            placeholder={session ? "Describe what you want to generate… (⌘↵ to send)" : "Connect your wallet to start creating"}
            disabled={!session || submitting}
            rows={2}
            className="w-full resize-none border-0 bg-transparent text-[13px] text-paper placeholder:text-muted/50 focus:outline-none focus:ring-0 disabled:opacity-40"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
            {media.map((item) => (
              <div key={item.id} className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                {item.type === "video" ? (
                  <video src={item.localUrl} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.localUrl} alt={item.label} className="h-full w-full object-cover" />
                )}
                {item.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-yellow border-t-transparent animate-spin" />
                  </div>
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
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!session || submitting}
              className="flex h-8 items-center gap-1 flex-shrink-0 rounded-lg border border-dashed border-white/20 px-2 text-[11px] font-medium text-muted hover:border-white/40 hover:text-paper transition-colors disabled:opacity-40"
            >
              <Plus className="h-3 w-3" /> Media
            </button>
          </div>

          <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-[13px] font-semibold text-muted hover:text-paper transition-colors">
            @
          </button>

          <button
            onClick={handleSubmit}
            disabled={!session || submitting || !prompt.trim()}
            className={cn(
              "flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-all",
              session && prompt.trim() && !submitting
                ? "bg-yellow text-ink hover:bg-yellow-bright shadow-[0_0_12px_rgba(255,241,118,0.25)]"
                : "bg-elevated text-muted cursor-not-allowed",
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
  );
}
