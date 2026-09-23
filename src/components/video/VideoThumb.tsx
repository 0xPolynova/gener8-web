"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Hls from "hls.js";
import { VideoPoster } from "@/components/video/VideoPoster";
import {
  captureVideoStill,
  isHlsUrl,
  readCachedStill,
  stillFromVideo,
} from "@/lib/video/thumbnail";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PosterPalette } from "@/types";

export type VideoThumbHandle = { play: () => void };

export const VideoThumb = forwardRef<VideoThumbHandle, {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  poster: PosterPalette;
  playing?: boolean;
  muted?: boolean;
  priority?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  className?: string;
}>(function VideoThumb({
  videoUrl,
  thumbnailUrl,
  poster,
  playing = false,
  muted = true,
  priority = false,
  loop = true,
  onEnded,
  className,
}, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playGen = useRef(0);
  const playingRef = useRef(playing);
  const mutedRef = useRef(muted);
  const retryPlay = useRef<(() => void) | null>(null);
  const gestureAt = useRef(0);
  playingRef.current = playing;
  mutedRef.current = muted;

  const [inView, setInView] = useState(priority);
  const [warmed, setWarmed] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [capturedStill, setCapturedStill] = useState<string | null>(() =>
    readCachedStill(videoUrl),
  );
  const [stillFailed, setStillFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    play() {
      const el = videoRef.current;
      if (!el) return;
      gestureAt.current = performance.now();
      el.muted = mutedRef.current;
      void el.play()?.then(() => setPlaybackReady(true)).catch(() => undefined);
    },
  }));

  const playable = mediaUrl(videoUrl);
  const hlsSource = isHlsUrl(playable);
  const still = stillFailed ? capturedStill : stillFromVideo(videoUrl, thumbnailUrl) ?? capturedStill;
  const mountVideo = Boolean(playable) && (playing || warmed || inView);
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
    if (!el || !mountVideo || !playable || !hlsSource) return;
    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = playable;
      return;
    }
    if (!Hls.isSupported()) return;
    const hls = new Hls({
      capLevelToPlayerSize: true,
      abrEwmaDefaultEstimate: 8_000_000,
    });
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const target = (el.clientHeight || 720) * (window.devicePixelRatio || 1);
      let best = hls.levels.length - 1;
      hls.levels.forEach((level, index) => {
        if (level.height && level.height <= target + 80) best = index;
      });
      if (best >= 0) hls.currentLevel = best;
      if (playingRef.current) retryPlay.current?.();
    });
    hls.loadSource(playable);
    hls.attachMedia(el);
    return () => hls.destroy();
  }, [hlsSource, mountVideo, playable]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !mountVideo) return;
    if (playing && performance.now() - gestureAt.current < 800) {
      el.muted = muted;
      return;
    }
    const gen = ++playGen.current;
    if (!playing) {
      retryPlay.current = null;
      el.pause();
      setPlaybackReady(false);
      return;
    }
    setWarmed(true);
    const start = () => {
      if (gen !== playGen.current) return;
      el.muted = mutedRef.current;
      if (!el.paused) {
        setPlaybackReady(true);
        return;
      }
      void el.play()?.then(() => {
        if (gen !== playGen.current) return;
        el.muted = mutedRef.current;
        setPlaybackReady(true);
      }).catch((error: unknown) => {
        if (gen !== playGen.current) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
      });
    };
    retryPlay.current = start;
    if (!el.paused) return;
    if (hlsSource && el.readyState === 0) return;
    start();
  }, [playing, muted, mountVideo, hlsSource]);

  const rememberStill = (el: HTMLVideoElement) => {
    setFrameReady(true);
    if (!videoUrl || stillFromVideo(videoUrl, thumbnailUrl)) return;
    const next = captureVideoStill(el, videoUrl);
    if (next) setCapturedStill(next);
  };

  return (
    <div
      ref={rootRef}
      className={cn("absolute inset-0 bg-ink", className)}
    >
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
          onError={() => setStillFailed(true)}
        />
      )}
      {mountVideo && (
        <video
          ref={videoRef}
          src={hlsSource ? undefined : playable ?? undefined}
          poster={still ?? undefined}
          muted={muted}
          loop={loop}
          playsInline
          onEnded={onEnded}
          preload={playing ? "auto" : "metadata"}
          onLoadedData={(e) => {
            if (!playing) rememberStill(e.currentTarget);
          }}
          onCanPlay={(e) => {
            if (playing && e.currentTarget.readyState >= 3) setPlaybackReady(true);
          }}
          onPlaying={() => {
            if (playingRef.current) setPlaybackReady(true);
          }}
          onPause={() => {
            if (!playingRef.current) setPlaybackReady(false);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            live || (!still && frameReady) ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
});
