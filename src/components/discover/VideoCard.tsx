"use client";

import { Heart, Share2, Maximize2, Volume2, VolumeX, Shuffle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { VideoThumb } from "@/components/video/VideoThumb";
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
        showMeta ? cn("h-full", spanClass[span]) : "",
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={`/video/${video.id}`}
        aria-label={video.title || promptPreview(video.prompt, 80)}
        className={cn(
          "relative block w-full overflow-hidden bg-ink",
          showMeta ? mediaAspect : aspectClass[video.aspectRatio] ?? "aspect-video",
        )}
      >
        <div className="absolute inset-0">
          <VideoThumb
            videoUrl={video.videoUrl}
            thumbnailUrl={video.thumbnailUrl}
            poster={video.poster}
            playing={hover}
            muted={muted}
            priority={priority}
          />
        </div>
        {showMeta && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        )}
        {/* Always-on overlay when showMeta=false (discover grid) */}
        {!showMeta && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
        )}
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
        {showMeta && (
          <div className="absolute bottom-3 left-3 right-3">
            <p className="line-clamp-2 text-[13px] font-medium leading-snug text-paper">
              {video.title || promptPreview(video.prompt, 80)}
            </p>
          </div>
        )}
      </Link>
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
          {onRemix && (
            <button
              type="button"
              aria-label={remixLabel}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemix(video);
              }}
              className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-full bg-yellow px-3 py-1 text-[16.5px] font-bold leading-none text-ink transition-all hover:bg-yellow-bright active:scale-95"
            >
              <Shuffle className="h-4 w-4" />
              {remixLabel}
            </button>
          )}
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
