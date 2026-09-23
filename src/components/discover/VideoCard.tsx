"use client";

import { Heart, Share2, Maximize2, Volume2, VolumeX, Shuffle, Wallet, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { GeneratingPoster } from "@/components/creations/GeneratingPoster";
import { VideoThumb } from "@/components/video/VideoThumb";
import { mediaUrl } from "@/lib/api";
import { formatCount, formatRelativeTime, promptPreview } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VideoWithCreator } from "@/types";
import { XLink } from "@/components/brand/XLink";

const spanClass: Record<string, string> = {
  hero: "md:col-span-2 md:row-span-2",
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  normal: "",
};

const aspectClass: Record<string, string> = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
};

export function VideoCard({
  video,
  onLike,
  onShare,
  onRemix,
  remixLabel = "Remix",
  muted = true,
  onToggleMute,
  showMeta = true,
  priority = false,
  fill = false,
  className,
  generating = false,
  published,
  onTogglePublish,
  onArchive,
}: {
  video: VideoWithCreator;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onRemix?: (video: VideoWithCreator) => void;
  remixLabel?: string;
  muted?: boolean;
  onToggleMute?: () => void;
  showMeta?: boolean;
  priority?: boolean;
  fill?: boolean;
  className?: string;
  generating?: boolean;
  published?: boolean;
  onTogglePublish?: () => void;
  onArchive?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const span = video.gridSpan ?? "normal";
  const mediaAspect =
    span === "hero"
      ? "aspect-[16/10] md:aspect-auto md:h-full"
      : span === "tall"
        ? "aspect-[9/14] md:aspect-auto md:h-full"
        : span === "wide"
          ? "aspect-[16/8]"
          : aspectClass[video.aspectRatio];

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[12px] border border-line bg-surface transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#333]",
        showMeta ? cn("h-full", spanClass[span]) : fill ? "h-full" : "",
        className,
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={`/video/${video.id}`}
        aria-label={video.title || promptPreview(video.prompt, 80)}
        className={cn(
          "relative block w-full overflow-hidden bg-ink",
          fill ? "h-full" : showMeta ? mediaAspect : aspectClass[video.aspectRatio] ?? "aspect-video",
        )}
      >
        <div className="absolute inset-0">
          {generating ? (
            <GeneratingPoster />
          ) : (
            <VideoThumb
              videoUrl={video.videoUrl}
              thumbnailUrl={video.thumbnailUrl}
              poster={video.poster}
              playing={hover}
              muted={muted}
              priority={priority}
            />
          )}
        </div>
        {showMeta && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        )}
        {/* Always-on overlay when showMeta=false (discover grid) */}
        {!showMeta && (
          <>
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
          </>
        )}
        {!showMeta && video.title && (
          <p className="pointer-events-none absolute left-3 top-3 z-10 max-w-[68%] text-[22px] font-bold leading-tight text-white">
            {video.title}
          </p>
        )}
        {!onTogglePublish && (
        <div className="pointer-events-none absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          {onToggleMute && (
            <QuickAction
              label={muted ? "Unmute" : "Mute"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMute();
              }}
            >
              {muted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-yellow" />
              )}
            </QuickAction>
          )}
          <QuickAction
            label="Like"
            onClick={(e) => {
              e.preventDefault();
              onLike?.(video.id);
            }}
          >
            <Heart
              className={cn("h-3.5 w-3.5", video.likedByMe && "fill-yellow text-yellow")}
            />
          </QuickAction>
          <QuickAction
            label="Share"
            onClick={(e) => {
              e.preventDefault();
              onShare?.(video.id);
            }}
          >
            <Share2 className="h-3.5 w-3.5" />
          </QuickAction>
          <QuickAction label="Open">
            <Maximize2 className="h-3.5 w-3.5" />
          </QuickAction>
        </div>
        )}
        {showMeta && (
          <div className="absolute bottom-3 left-3 right-3">
            <p className="line-clamp-2 text-[13px] font-medium leading-snug text-paper">
              {video.title || promptPreview(video.prompt, 80)}
            </p>
          </div>
        )}
      </Link>
      {!showMeta && onTogglePublish && (
        <button
          type="button"
          aria-label={published ? "Unpublish" : "Publish"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePublish();
          }}
          className={cn(
            "absolute right-3 top-3 z-20 h-7 w-12 rounded-full transition-colors",
            published ? "bg-yellow" : "bg-white/30",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
              published ? "left-5" : "left-0.5",
            )}
          />
        </button>
      )}
      {!showMeta && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-2 px-3 py-2.5">
          <div className="pointer-events-auto min-w-0">
            <p className="truncate text-[16px] font-semibold leading-none text-white">
              {video.creator.displayName || video.creator.username}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {video.creator.xHandle && (
                <p className="truncate text-[13px] leading-none text-white/70">
                  @{video.creator.xHandle}
                </p>
              )}
              <XLink handle={video.creator.xHandle} compact className="shrink-0 text-white/80" />
            </div>
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            {onArchive && (
              <IconButton label="Archive" onClick={() => onArchive()}>
                <Trash2 className="h-5 w-5" strokeWidth={2.5} />
              </IconButton>
            )}
            {!generating && mediaUrl(video.videoUrl) && (
              <IconButton label="Download" onClick={() => void downloadVideo(video)}>
                <Download className="h-5 w-5" strokeWidth={2.5} />
              </IconButton>
            )}
            {onRemix && (
              <button
                type="button"
                aria-label={remixLabel}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemix(video);
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-yellow px-3.5 py-2.5 text-[16.5px] font-bold leading-none text-ink transition-all hover:bg-yellow-bright active:scale-95"
              >
                {remixLabel === "Connect wallet" ? (
                  <Wallet className="h-4 w-4" />
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
                {remixLabel}
              </button>
            )}
          </div>
        </div>
      )}
      {showMeta && (
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <Link href={`/profile/${video.creator.username}`} className="shrink-0">
            <Avatar
              name={video.creator.displayName}
              palette={video.creator.avatarPalette}
              src={video.creator.avatarUrl}
              size={26}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${video.creator.username}`}
                className="min-w-0 truncate text-[13px] font-medium text-paper hover:text-yellow"
              >
                {video.creator.displayName || video.creator.username}
              </Link>
              <XLink handle={video.creator.xHandle} compact className="shrink-0" />
            </div>
            <p className="text-[11px] text-muted">
              {formatCount(video.views)} views · {formatCount(video.likes)} likes ·{" "}
              {formatRelativeTime(video.createdAt)}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
    >
      {children}
    </button>
  );
}

async function downloadVideo(video: VideoWithCreator) {
  const href = mediaUrl(video.videoUrl);
  if (!href) return;
  const name = `${(video.title || "gener8").replace(/[^\w\- ]+/g, "").trim() || "gener8"}.mp4`;
  try {
    const res = await fetch(href);
    if (!res.ok) throw new Error("download failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = name;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.click();
  }
}

function QuickAction({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
      }}
      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/55 text-paper backdrop-blur-sm transition-colors hover:border-yellow/40 hover:text-yellow"
    >
      {children}
    </button>
  );
}
