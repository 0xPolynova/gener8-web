"use client";

import { useEffect, useRef, useState } from "react";
import { VideoPoster } from "@/components/video/VideoPoster";
import {
  captureVideoStill,
  readCachedStill,
  stillFromVideo,
} from "@/lib/video/thumbnail";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PosterPalette } from "@/types";

export function VideoThumb({
  videoUrl,
  thumbnailUrl,
  poster,
  playing = false,
  muted = true,
  priority = false,
  className,
}: {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  poster: PosterPalette;
  playing?: boolean;
  muted?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const [inView, setInView] = useState(priority);
  const [warmed, setWarmed] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [capturedStill, setCapturedStill] = useState<string | null>(() =>
    readCachedStill(videoUrl),
  );

  const playable = mediaUrl(videoUrl);
  const still = stillFromVideo(videoUrl, thumbnailUrl) ?? capturedStill;
  const mountVideo =
    Boolean(playable) && (playing || warmed || (inView && !still));
  const live = playing && playbackReady;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          return;
        }
        setInView(false);
        setWarmed(false);
        setPlaybackReady(false);
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted, mountVideo]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !mountVideo) return;
    el.muted = mutedRef.current;
    if (playing) {
      setWarmed(true);
      if (el.currentTime > 0.08) el.currentTime = 0;
      void el
        .play()
        .then(() => {
          if (!el.paused) setPlaybackReady(true);
        })
        .catch(() => undefined);
      return;
    }
    el.pause();
    setPlaybackReady(false);
  }, [playing, mountVideo]);

  const rememberStill = (el: HTMLVideoElement) => {
    setFrameReady(true);
    if (!videoUrl || stillFromVideo(videoUrl, thumbnailUrl)) return;
    const next = captureVideoStill(el, videoUrl);
    if (next) setCapturedStill(next);
  };

  return (
    <div ref={rootRef} className={cn("absolute inset-0 bg-ink", className)}>
      <VideoPoster
        palette={poster}
        className={cn(
          "transition-opacity duration-200",
          still || frameReady || live ? "opacity-0" : "opacity-100",
        )}
      />
      {still && (
        <img
          src={still}
          alt=""
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            live ? "opacity-0" : "opacity-100",
          )}
        />
      )}
      {mountVideo && (
        <video
          ref={videoRef}
          src={playable ?? undefined}
          poster={still ?? undefined}
          muted={muted}
          loop
          playsInline
          preload={playing ? "auto" : "metadata"}
          onLoadedData={(e) => {
            if (!playing) rememberStill(e.currentTarget);
          }}
          onPlaying={() => setPlaybackReady(true)}
          onPause={() => setPlaybackReady(false)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
            playing ? "scale-[1.03]" : "scale-100",
            live || (!still && frameReady) ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
