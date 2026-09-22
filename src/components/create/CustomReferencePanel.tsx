"use client";

import { ChevronDown, ImagePlus, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_STYLE_REFS = 4;

export function CustomReferencePanel({
  baseVideo,
  firstFrame,
  lastFrame,
  styleRefs,
  onBaseVideo,
  onFirstFrame,
  onLastFrame,
  onStyleRefs,
  disabled = false,
}: {
  baseVideo: File | null;
  firstFrame: File | null;
  lastFrame: File | null;
  styleRefs: File[];
  onBaseVideo: (file: File | null) => void;
  onFirstFrame: (file: File | null) => void;
  onLastFrame: (file: File | null) => void;
  onStyleRefs: (files: File[]) => void;
  disabled?: boolean;
}) {
  const frameCount = Number(Boolean(firstFrame)) + Number(Boolean(lastFrame));
  const swap = Boolean(baseVideo);

  return (
    <div
      className={cn("space-y-2", disabled && "pointer-events-none opacity-50")}
    >
      <CollapseSection
        title="Base video"
        hint="Swap a person into an existing clip · first 15s"
        count={Number(swap)}
        countMax={1}
      >
        <div className="pt-1">
          <VideoSlot
            file={baseVideo}
            onChange={onBaseVideo}
            disabled={disabled}
          />
        </div>
      </CollapseSection>

      {!swap && (
        <CollapseSection
          title="Reference images"
          hint="First and last frame for image-to-video"
          count={frameCount}
          countMax={2}
        >
          <div className="grid grid-cols-2 gap-2 pt-1">
            <ImageSlot
              label="First frame"
              file={firstFrame}
              onChange={onFirstFrame}
              disabled={disabled}
            />
            <ImageSlot
              label="Last frame"
              file={lastFrame}
              onChange={onLastFrame}
              disabled={disabled}
            />
          </div>
        </CollapseSection>
      )}

      <CollapseSection
        title="Style / character"
        hint={
          swap
            ? `Replacement person · first photo is @Image1 · up to ${MAX_STYLE_REFS}`
            : `Optional · up to ${MAX_STYLE_REFS}`
        }
        count={styleRefs.length}
        countMax={MAX_STYLE_REFS}
      >
        <div className="pt-1">
          <StyleRefRow
            files={styleRefs}
            onChange={onStyleRefs}
            disabled={disabled}
          />
        </div>
      </CollapseSection>
    </div>
  );
}

function CollapseSection({
  title,
  hint,
  count,
  countMax,
  children,
}: {
  title: string;
  hint: string;
  count: number;
  countMax: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[12px] border border-line bg-elevated">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-paper">{title}</span>
            {count > 0 && (
              <span className="rounded-full border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                {count}/{countMax}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">{hint}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="border-t border-line px-3 pb-3">{children}</div>}
    </div>
  );
}

function VideoSlot({
  file,
  onChange,
  disabled = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useObjectUrl(file);

  return (
    <div>
      {preview ? (
        <div className="relative overflow-hidden rounded-[10px] border border-line">
          <video
            src={preview}
            muted
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black object-contain"
          />
          <p className="truncate border-t border-line px-2.5 py-1.5 text-[11px] text-muted">
            {file?.name}
          </p>
          <button
            type="button"
            aria-label="Remove base video"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-paper disabled:cursor-not-allowed"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (disabled) return;
            const next = videoFromList(e.dataTransfer.files);
            if (next) onChange(next);
          }}
          className="grid aspect-video w-full place-items-center rounded-[10px] border border-dashed border-line text-muted transition-colors hover:border-[#333] hover:text-paper disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-muted"
        >
          <span className="flex flex-col items-center gap-1">
            <Video className="h-5 w-5" />
            <span className="text-[11px]">Add video</span>
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/*"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (disabled) return;
          const next = videoFromList(e.target.files);
          if (next) onChange(next);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ImageSlot({
  label,
  file,
  onChange,
  disabled = false,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useObjectUrl(file);

  return (
    <div>
      <p className="mb-1.5 text-[11px] text-muted">{label}</p>
      {preview ? (
        <div className="relative aspect-video overflow-hidden rounded-[10px] border border-line">
          <img src={preview} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label={`Remove ${label}`}
            disabled={disabled}
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-paper disabled:cursor-not-allowed"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (disabled) return;
            const next = imageFromList(e.dataTransfer.files);
            if (next) onChange(next);
          }}
          className="grid aspect-video w-full place-items-center rounded-[10px] border border-dashed border-line text-muted transition-colors hover:border-[#333] hover:text-paper disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-muted"
        >
          <span className="flex flex-col items-center gap-1">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px]">Add photo</span>
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (disabled) return;
          const next = imageFromList(e.target.files);
          if (next) onChange(next);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function StyleRefRow({
  files,
  onChange,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useObjectUrls(files);

  return (
    <div className="flex flex-wrap gap-2">
      {previews.map((item, i) => (
        <div
          key={`${item.url}-${i}`}
          className="relative h-20 w-20 overflow-hidden rounded-[10px] border border-line"
        >
          <img src={item.url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Remove image"
            disabled={disabled}
            onClick={() => onChange(files.filter((_, idx) => idx !== i))}
            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-paper disabled:cursor-not-allowed"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {files.length < MAX_STYLE_REFS && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (disabled) return;
            onChange(mergeImages(files, e.dataTransfer.files));
          }}
          className="grid h-20 w-20 place-items-center rounded-[10px] border border-dashed border-line text-muted transition-colors hover:border-[#333] hover:text-paper disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-muted"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (disabled) return;
          onChange(mergeImages(files, e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function videoFromList(list: FileList | null) {
  if (!list?.length) return null;
  return Array.from(list).find((file) => file.type.startsWith("video/")) ?? null;
}

function imageFromList(list: FileList | null) {
  if (!list?.length) return null;
  return Array.from(list).find((file) => file.type.startsWith("image/")) ?? null;
}

function mergeImages(current: File[], incoming: FileList | null) {
  const extras = incoming
    ? Array.from(incoming).filter((file) => file.type.startsWith("image/"))
    : [];
  return [...current, ...extras].slice(0, MAX_STYLE_REFS);
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function useObjectUrls(files: File[]) {
  const [items, setItems] = useState<{ file: File; url: string }[]>([]);
  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setItems(next);
    return () => next.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);
  return items;
}
