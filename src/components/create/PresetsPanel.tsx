"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VideoPoster } from "@/components/video/VideoPoster";
import { Button } from "@/components/ui/Button";
import { PresetComposer } from "@/components/create/PresetComposer";
import { CREATE_PRESETS, type CreatePreset } from "@/lib/data/presets";
import { cn } from "@/lib/utils";
import type { GenerationStatus, VideoWithCreator } from "@/types";

export function PresetsPanel({
  selectedId,
  images,
  onSelect,
  onImagesChange,
  onUsePreset,
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
  selectedId: string | null;
  images: (File | null)[];
  onSelect: (preset: CreatePreset) => void;
  onImagesChange: (files: (File | null)[]) => void;
  onUsePreset: (preset: CreatePreset) => void;
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
  const selected = CREATE_PRESETS.find((p) => p.id === selectedId) ?? null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const slots = selected?.imageSlots ?? 4;
  const files = images.filter((item): item is File => item != null);

  useEffect(() => {
    const next = images
      .filter((item): item is File => item != null)
      .map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
    setPreviews(next);
    return () => next.forEach((item) => URL.revokeObjectURL(item.url));
  }, [images]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, slots);
    onImagesChange(next);
  };

  if (selected?.composer === "character-swap") {
    return (
      <PresetComposer
        preset={selected}
        images={images}
        onImagesChange={onImagesChange}
        onBack={onBack}
        onGenerate={onGenerate}
        canGenerate={canGenerate}
        generateHint={generateHint}
        generating={generating}
        onCancel={onCancel}
        status={status}
        video={video}
        startedAt={startedAt}
        onPublish={onPublish}
        onRegenerate={onRegenerate}
        onFinish={onFinish}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight">Presets</h1>
        <p className="mt-1 text-sm text-muted">
          Click a look, add reference images, then continue to generate.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CREATE_PRESETS.map((preset) => {
          const active = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={cn(
                "overflow-hidden rounded-[12px] border bg-surface text-left transition-colors",
                active ? "border-yellow" : "border-line hover:border-[#333]",
              )}
            >
              <div className="relative aspect-[16/10]">
                {preset.basePosterUrl || preset.baseVideoUrl ? (
                  <>
                    {preset.basePosterUrl && (
                      <img
                        src={preset.basePosterUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    {preset.baseVideoUrl && (
                      <video
                        src={preset.baseVideoUrl}
                        poster={preset.basePosterUrl}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover"
                        onMouseEnter={(e) =>
                          void e.currentTarget.play().catch(() => undefined)
                        }
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    )}
                  </>
                ) : (
                  <VideoPoster palette={preset.palette} />
                )}
                {preset.overlayTitle && (
                  <span className="absolute inset-0 grid place-items-center text-[15px] font-semibold tracking-[0.16em] text-[#d6c7ff] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    {preset.overlayTitle}
                  </span>
                )}
                {preset.tag && (
                  <span className="absolute left-2 top-2 rounded-full border border-yellow/30 bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-yellow backdrop-blur-sm">
                    {preset.tag}
                  </span>
                )}
                <span className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/55 px-2 py-0.5 text-[10px] font-medium text-paper backdrop-blur-sm">
                  {preset.aspectRatio}
                </span>
              </div>
              <div className="px-3 py-3">
                <p className="text-[13px] font-medium text-paper">{preset.title}</p>
                <p className="mt-0.5 text-[12px] text-muted">{preset.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-6 rounded-[12px] border border-line bg-elevated p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-paper">{selected.title}</p>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
                {selected.prompt}
              </p>
            </div>
            <Button onClick={() => onUsePreset(selected)}>Use preset</Button>
          </div>

          <p className="mt-4 mb-2 text-[12px] font-medium text-paper">
            Reference images
            <span className="ml-1.5 font-normal text-muted">
              optional · up to {slots}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {previews.map((item, i) => (
              <div
                key={item.url}
                className="relative h-20 w-20 overflow-hidden rounded-[10px] border border-line"
              >
                <img src={item.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  disabled={generating}
                  onClick={() =>
                    onImagesChange(files.filter((_, idx) => idx !== i))
                  }
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-paper disabled:cursor-not-allowed"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {files.length < slots && (
              <button
                type="button"
                disabled={generating}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (generating) return;
                  addFiles(e.dataTransfer.files);
                }}
                className="grid h-20 w-20 place-items-center rounded-[10px] border border-dashed border-line text-muted transition-colors hover:border-[#333] hover:text-paper disabled:cursor-not-allowed disabled:hover:border-line"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={generating}
            className="hidden"
            onChange={(e) => {
              if (generating) return;
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
