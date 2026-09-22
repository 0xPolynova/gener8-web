"use client";

import { ArrowLeft, Plus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PreviewStage } from "@/components/create/PreviewStage";
import type { CreatePreset } from "@/lib/data/presets";
import { cn } from "@/lib/utils";
import type { GenerationStatus, VideoWithCreator } from "@/types";

export function PresetComposer({
  preset,
  images,
  onImagesChange,
  onBack,
  onGenerate,
  canGenerate,
  generateHint,
  generating,
  onCancel,
  status,
  video,
  startedAt,
  onPublish,
  onRegenerate,
  onFinish,
}: {
  preset: CreatePreset;
  images: (File | null)[];
  onImagesChange: (files: (File | null)[]) => void;
  onBack: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
  generateHint?: string | null;
  generating: boolean;
  onCancel?: () => void;
  status: GenerationStatus | "idle";
  video: VideoWithCreator | null;
  startedAt: number | null;
  onPublish: () => void;
  onRegenerate: () => void;
  onFinish?: () => void;
}) {
  const slots = preset.imageSlots;
  const labels =
    preset.slotLabels ??
    Array.from({ length: slots }, (_, i) => `Person ${i + 1}`);
  const slotFiles = Array.from({ length: slots }, (_, i) => images[i] ?? null);
  const filled = slotFiles.filter(Boolean).length;

  const replaceSlot = (index: number, file: File | null) => {
    const next = [...slotFiles];
    next[index] = file;
    onImagesChange(next);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onBack}
        disabled={generating}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Presets
      </button>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div>
          <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
            <BaseClip
              src={preset.baseVideoUrl}
              poster={preset.basePosterUrl}
              overlay={preset.overlayTitle}
              tag={preset.tag}
              palette={preset.palette}
            />

            <div className="px-4 pb-4 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[14px] font-medium text-paper">Photos</p>
                <p className="text-[13px] tabular-nums text-muted">
                  {filled}/{slots}
                </p>
              </div>

              <div
                className={cn(
                  "grid gap-3",
                  slots > 2 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
                )}
              >
                {labels.map((label, i) => (
                  <PersonSlot
                    key={label}
                    label={label}
                    file={slotFiles[i]}
                    onFile={(file) => replaceSlot(i, file)}
                    onClear={() => replaceSlot(i, null)}
                    disabled={generating}
                    compact={slots > 2}
                  />
                ))}
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={!canGenerate || filled < slots || generating}
            onClick={onGenerate}
          >
            {generating ? "Generating…" : "Generate video"}
          </Button>
          {generating ? (
            <p className="mt-2 text-center text-[12px] text-muted">
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-paper underline-offset-2 hover:underline"
                >
                  Stop and try again
                </button>
              ) : (
                "Generation in progress."
              )}
            </p>
          ) : filled < slots ? (
            <p className="mt-2 text-center text-[12px] text-muted">
              Add all {slots} photos to generate.
            </p>
          ) : generateHint ? (
            <p className="mt-2 text-center text-[12px] text-muted">
              {generateHint}
            </p>
          ) : null}
        </div>

        <PreviewStage
          compact
          showEdit={false}
          aspectRatio={preset.aspectRatio}
          status={status}
          video={video}
          startedAt={startedAt}
          onPublish={onPublish}
          onRegenerate={onRegenerate}
          onEdit={() => undefined}
          onFinish={onFinish}
        />
      </div>
    </div>
  );
}

function BaseClip({
  src,
  poster,
  overlay,
  tag,
  palette,
}: {
  src?: string;
  poster?: string;
  overlay?: string;
  tag?: string;
  palette: CreatePreset["palette"];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden bg-ink">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(80% 70% at 50% 40%, ${palette.via}, ${palette.from})`,
        }}
      />
      {poster && (
        <img
          src={poster}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity",
            ready ? "opacity-0" : "opacity-100",
          )}
        />
      )}
      {src && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          onCanPlay={() => {
            setReady(true);
            void videoRef.current?.play().catch(() => undefined);
          }}
          onError={() => setReady(false)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity",
            ready ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {overlay && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="text-center text-[28px] font-semibold tracking-[0.18em] text-[#d6c7ff] drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] md:text-[32px]">
            {overlay}
          </p>
        </div>
      )}
      {tag && (
        <span className="absolute left-3 top-3 rounded-full border border-yellow/30 bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-yellow backdrop-blur-sm">
          {tag}
        </span>
      )}
    </div>
  );
}

function PersonSlot({
  label,
  file,
  onFile,
  onClear,
  disabled = false,
  compact = false,
}: {
  label: string;
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const take = (list: FileList | null) => {
    const next = list?.[0];
    if (next && next.type.startsWith("image/")) onFile(next);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (disabled) return;
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        take(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[14px] bg-[#161616] px-3 text-center transition-colors",
        compact ? "min-h-[156px] py-4" : "min-h-[188px] py-5",
        over && "ring-1 ring-yellow/60",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt=""
            className="mb-3 h-[88px] w-[88px] rounded-[10px] object-cover"
          />
          <p className="text-[14px] font-medium text-paper">{label}</p>
          <button
            type="button"
            aria-label={`Remove ${label}`}
            disabled={disabled}
            onClick={onClear}
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-paper hover:bg-black disabled:cursor-not-allowed"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-[10px] border border-[#2a2a2a] bg-[#1c1c1c] text-muted">
            <Plus className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <p className="text-[14px] font-medium text-paper">{label}</p>
          <p className="mt-1 max-w-[11rem] text-[11px] leading-snug text-muted">
            Drop from History or another page
          </p>
          <Button
            size="sm"
            variant="subtle"
            className="mt-3 h-8 rounded-full px-3.5"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (disabled) return;
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
