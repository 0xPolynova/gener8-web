"use client";

import { Check, Download, Pencil, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { formatElapsed } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AspectRatio, GenerationStatus, VideoWithCreator } from "@/types";

const STAGE_COPY: Record<GenerationStatus, string> = {
  queued: "Queued…",
  preparing: "Preparing your shot…",
  generating: "Generating your video…",
  processing: "Processing motion and color…",
  complete: "Complete",
  failed: "Generation failed",
};

export function PreviewStage({
  aspectRatio,
  status,
  video,
  startedAt,
  onPublish,
  onRegenerate,
  onEdit,
  onFinish,
  compact = false,
  showEdit = true,
}: {
  aspectRatio: AspectRatio;
  status: GenerationStatus | "idle";
  video: VideoWithCreator | null;
  startedAt: number | null;
  onPublish: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onFinish?: () => void;
  compact?: boolean;
  showEdit?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        compact
          ? "overflow-hidden rounded-[16px] border border-line bg-surface"
          : cn(
              "rounded-[14px] border border-line bg-surface",
              aspectRatio === "9:16"
                ? "items-center"
                : "h-full min-h-[480px]",
            ),
      )}
    >
      <div
        data-aspect={aspectRatio}
        className={cn(
          "relative overflow-hidden bg-ink",
          aspectRatio === "9:16"
            ? compact
              ? "aspect-[9/16] w-full"
              : "aspect-[9/16] h-[min(68vh,640px)] w-auto max-w-full"
            : aspectRatio === "1:1"
              ? "aspect-square w-full"
              : "aspect-video w-full",
        )}
      >
        {status === "idle" && !video && <IdleFrame />}
        {status !== "idle" && status !== "complete" && status !== "failed" && (
          <GeneratingFrame status={status} startedAt={startedAt} />
        )}
        {status === "failed" && <FailedFrame onRegenerate={onRegenerate} />}
        {status === "complete" && video?.videoUrl && (
          <CompletedFrame videoUrl={video.videoUrl} />
        )}
      </div>

      {status === "complete" && video && (
        <div
          className={cn(
            "flex flex-wrap gap-2",
            compact ? "justify-start px-4 py-3" : "items-center justify-center px-4 py-4",
          )}
        >
          <a href={video.videoUrl} download>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </a>
          <Button size="sm" onClick={onPublish}>
            <Upload className="h-3.5 w-3.5" />
            {video.visibility === "public" ? "Unpublish" : "Publish"}
          </Button>
          {showEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit prompt
            </Button>
          )}
          {onFinish && (
            <Button size="sm" onClick={onFinish}>
              <Check className="h-3.5 w-3.5" />
              Finish
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function IdleFrame() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <BrandMark size={32} className="block" />
      </div>
      <p className="absolute left-1/2 top-[calc(50%+28px)] z-10 w-full -translate-x-1/2 text-center text-sm text-muted">
        Generated clip lands here.
      </p>
      <div className="pointer-events-none absolute inset-6 rounded-[10px] border border-dashed border-line" />
    </div>
  );
}

function GeneratingFrame({
  status,
  startedAt,
}: {
  status: GenerationStatus;
  startedAt: number | null;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);
  const elapsed = startedAt ? now - startedAt : 0;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070705]">
      <div className="animate-glow absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow/25" />
      <div className="animate-grain pointer-events-none absolute -inset-8 opacity-[0.07] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.55%22/></svg>')]" />
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <BrandMark size={40} className="block" />
      </div>
      <div className="absolute left-1/2 top-[calc(50%+36px)] z-10 w-full -translate-x-1/2 text-center">
        <p className="text-sm font-medium text-paper">
          {STAGE_COPY[status]}
        </p>
        <p className="mt-1 font-mono text-xs text-muted">
          {formatElapsed(elapsed)}
        </p>
      </div>
    </div>
  );
}

function FailedFrame({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink p-6 text-center">
      <div>
        <p className="text-sm font-medium text-paper">Generation failed</p>
        <p className="mt-1 text-xs text-muted">
          Your prompt is saved. Try again.
        </p>
        <Button className="mt-4" size="sm" onClick={onRegenerate}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function CompletedFrame({ videoUrl }: { videoUrl: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <video
      ref={ref}
      src={videoUrl}
      className="absolute inset-0 h-full w-full object-cover object-center"
      controls
      autoPlay
      playsInline
    />
  );
}
