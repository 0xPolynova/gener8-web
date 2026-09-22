"use client";

import { useRef, useState, useCallback } from "react";
import { X, Plus, Sparkles, Settings2, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppState } from "@/components/providers/AppState";
import { useToast } from "@/components/ui/Toast";
import type { GenerationJob, Video } from "@/types";
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
  resolution: "720P" | "1080P";
  ratio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  duration: number;
}

const RATIOS: OmniSettings["ratio"][] = ["16:9", "4:3", "1:1", "3:4", "9:16"];

const RATIO_SIZE: Record<OmniSettings["ratio"], string> = {
  "16:9": "1280*720",
  "9:16": "720*1280",
  "1:1": "960*960",
  "4:3": "1088*832",
  "3:4": "832*1088",
};

let imgCount = 0;
let vidCount = 0;

function nextLabel(type: "image" | "video") {
  if (type === "image") return `Image ${++imgCount}`;
  return `Video ${++vidCount}`;
}

interface OmniBoxProps {
  onJobCreated?: (job: GenerationJob, video: Video) => void;
}

export function OmniBox({ onJobCreated }: OmniBoxProps) {
  const { session, eligibility } = useAppState();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<OmniMedia[]>([]);
  const [settings, setSettings] = useState<OmniSettings>({
    resolution: "720P",
    ratio: "16:9",
    duration: 15,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const remaining =
    eligibility?.remainingToday ?? eligibility?.dailyLimit ?? 0;

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
              m.id === item.id
                ? { ...m, uploadedUrl: data.url, uploading: false }
                : m,
            ),
          );
        } catch {
          toast(`Couldn't upload ${file.name}`, "error");
          setMedia((prev) => prev.filter((m) => m.id !== item.id));
          URL.revokeObjectURL(item.localUrl);
        }
      }

      // Auto-insert labels into prompt
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
    if (!session) {
      toast("Connect your wallet to generate.", "error");
      return;
    }
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast("Write a prompt first.", "error");
      return;
    }
    if (media.some((m) => m.uploading)) {
      toast("Wait for uploads to finish.", "error");
      return;
    }

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
            quality: settings.resolution === "1080P" ? "high" : "standard",
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
      if (!res.ok) {
        toast(data.error ?? "Generation failed.", "error");
        return;
      }

      toast("Generating… this takes ~60s.", "success");
      setPrompt("");
      setMedia([]);
      imgCount = 0;
      vidCount = 0;
      if (onJobCreated) onJobCreated(data.job as GenerationJob, data.video as Video);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't start generation.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mb-8">
      {/* Glow layers */}
      <div className="pointer-events-none absolute -inset-px rounded-[18px] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-yellow/20 animate-glow blur-md" />
      <div className="pointer-events-none absolute -inset-px rounded-[18px] border border-white/10" />

      <div className="relative rounded-[16px] bg-surface/90 backdrop-blur-sm overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          {/* Mode selector */}
          <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium text-paper bg-elevated hover:bg-white/10 transition-colors">
            Omni
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Model badge */}
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] font-medium text-muted">
              <span className="h-2.5 w-2.5 rounded-full border border-violet-400/60 bg-violet-500/20" />
              Wan3.0
            </div>

            {/* Settings badge */}
            <button
              onClick={() => setShowSettings((s) => !s)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                showSettings
                  ? "border-yellow/40 text-yellow"
                  : "border-white/10 text-muted hover:border-white/20 hover:text-paper",
              )}
            >
              {settings.resolution}
              <span className="text-white/20">|</span>
              {settings.ratio}
              <span className="text-white/20">|</span>
              {settings.duration}s
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mx-4 mb-3 rounded-xl border border-white/8 bg-elevated p-4 space-y-4 animate-rise">
            {/* Resolution */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                Resolution
              </p>
              <div className="flex gap-2">
                {(["720P", "1080P"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSettings((s) => ({ ...s, resolution: r }))}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-[13px] font-medium transition-colors",
                      settings.resolution === r
                        ? "bg-yellow text-ink"
                        : "bg-elevated border border-white/10 text-muted hover:text-paper",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Ratio */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                Aspect Ratio
              </p>
              <div className="flex gap-2 flex-wrap">
                {RATIOS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSettings((s) => ({ ...s, ratio: r }))}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                      settings.ratio === r
                        ? "bg-yellow text-ink"
                        : "bg-elevated border border-white/10 text-muted hover:text-paper",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                Duration — {settings.duration}s
              </p>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={settings.duration}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, duration: Number(e.target.value) }))
                }
                className="w-full accent-yellow"
              />
              <div className="flex justify-between text-[11px] text-muted mt-1">
                <span>2s</span>
                <span>30s</span>
              </div>
            </div>
          </div>
        )}

        {/* Prompt area */}
        <div className="px-4 pb-2">
          {/* Media chips inline */}
          {media.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {media.map((item) => (
                <span
                  key={item.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
                    item.type === "video"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                      : "bg-violet-500/15 text-violet-300 border border-violet-500/25",
                  )}
                >
                  {item.type === "video" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <span className="h-4 w-6 overflow-hidden rounded">
                      <video
                        src={item.localUrl}
                        className="h-full w-full object-cover"
                        muted
                      />
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.localUrl}
                      alt={item.label}
                      className="h-4 w-4 rounded object-cover"
                    />
                  )}
                  {item.uploading ? (
                    <span className="animate-pulse">{item.label}…</span>
                  ) : (
                    item.label
                  )}
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder={
              session
                ? "Describe what you want to generate…"
                : "Connect your wallet to start creating"
            }
            disabled={!session || submitting}
            rows={3}
            className="w-full resize-none bg-transparent text-[14px] text-paper placeholder:text-muted/50 focus:outline-none disabled:opacity-40"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2">
          {/* Thumbnails */}
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
            {media.map((item) => (
              <div
                key={item.id}
                className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-white/10"
              >
                {item.type === "video" ? (
                  <video
                    src={item.localUrl}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.localUrl}
                    alt={item.label}
                    className="h-full w-full object-cover"
                  />
                )}
                {item.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
                    <span className="h-3 w-3 rounded-full border-2 border-yellow border-t-transparent animate-spin" />
                  </div>
                )}
                {item.uploading && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow/60 animate-pulse" />
                )}
              </div>
            ))}

            {/* Add media button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              onClick={(e) => {
                (e.target as HTMLInputElement).value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!session || submitting}
              className="flex h-9 items-center gap-1.5 flex-shrink-0 rounded-lg border border-dashed border-white/20 px-2.5 text-[12px] font-medium text-muted hover:border-white/40 hover:text-paper transition-colors disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Media
            </button>
          </div>

          {/* @ mention button */}
          <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold text-muted hover:text-paper transition-colors">
            @
          </button>

          {/* Generate button */}
          <button
            onClick={handleSubmit}
            disabled={!session || submitting || !prompt.trim()}
            className={cn(
              "flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-all",
              session && prompt.trim() && !submitting
                ? "bg-yellow text-ink hover:bg-yellow-bright shadow-[0_0_14px_rgba(255,241,118,0.3)]"
                : "bg-elevated text-muted cursor-not-allowed",
            )}
          >
            {submitting ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/40 border-t-ink animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {remaining > 0 ? remaining : ""}
          </button>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted/50">
        Wan 3.0 · 720P · up to 30s · attach images &amp; videos as reference
      </p>
    </div>
  );
}
