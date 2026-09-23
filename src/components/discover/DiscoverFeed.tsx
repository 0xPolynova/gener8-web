"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { VideoCard } from "./VideoCard";
import { BentoGrid } from "./BentoGrid";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { promptPreview } from "@/lib/format";
import { BrandMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { DiscoverFilter, VideoWithCreator } from "@/types";
import { apiFetch } from "@/lib/api";
import { HoldGate } from "@/components/token/HoldGate";
import { isAdminWallet } from "@/lib/admin";

const PAGE_SIZE = 8;

const FILTERS: { id: DiscoverFilter; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "viral", label: "viral" },
  { id: "tokens", label: "tokens" },
  { id: "memecoins", label: "memecoins" },
  { id: "pnl", label: "P&L" },
  { id: "music", label: "music" },
  { id: "15s", label: "15s" },
  { id: "30s", label: "30s" },
];

export function DiscoverFeed() {
  const { toast } = useToast();
  const { session, walletAddress, eligibility, tokenMint } = useAppState();
  const [gateOpen, setGateOpen] = useState(false);
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [filter, setFilter] = useState<DiscoverFilter>("trending");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const spotlightStarted = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/videos?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: VideoWithCreator[] = [...(data.videos ?? [])].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
        );
        setVideos(list);
        setShown(PAGE_SIZE);
      })
      .catch(() => toast("Couldn’t load the feed. Try again.", "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast, filter]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setShown((count) => Math.min(videos.length, count + PAGE_SIZE));
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, videos.length, shown]);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("v");
    if (!shared || loading || spotlightStarted.current === shared) return;
    const index = videos.findIndex((video) => video.id === shared);
    if (index < 0) return;
    spotlightStarted.current = shared;
    setShown((count) => Math.max(count, index + 1));
    setSpotlight(shared);
  }, [loading, videos]);

  useEffect(() => {
    if (!spotlight) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-video="${spotlight}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [spotlight, shown]);

  useEffect(() => {
    if (!spotlight) return;
    let streakStart = 0;
    let last = 0;
    let timer = 0;
    const onMove = () => {
      const now = Date.now();
      if (!last || now - last > 500) streakStart = now;
      last = now;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSpotlight(null), Math.max(0, 2500 - (now - streakStart)));
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.clearTimeout(timer);
    };
  }, [spotlight]);

  const onLike = async (id: string) => {
    if (!session) {
      toast("Connect your wallet to like a video.");
      return;
    }
    const res = await apiFetch(`/api/videos/${id}/like`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Couldn’t like that.", "error");
      return;
    }
    setVideos((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, likes: data.likes, likedByMe: data.liked } : v,
      ),
    );
  };

  const onShare = async (id: string) => {
    const url = `${window.location.origin}/discover?v=${id}`;
    await navigator.clipboard.writeText(url);
    toast("Link copied", "success");
  };

  const onRemix = (video: VideoWithCreator) => {
    if (!walletAddress) {
      window.dispatchEvent(new Event("gener8:connect"));
      return;
    }
    const holds =
      isAdminWallet(walletAddress) ||
      (Boolean(session) &&
        (eligibility?.state === "eligible" || eligibility?.state === "limit_reached"));
    if (!holds) {
      setGateOpen(true);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("omni:remix", {
        detail: {
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          aspectRatio: video.aspectRatio,
          title: video.title || promptPreview(video.prompt, 60),
          prompt: video.prompt,
          id: video.id,
        },
      }),
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
          {FILTERS.map((item) => {
            const active = item.id === filter;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-xl border px-4 py-3 transition-colors",
                  active
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8",
                )}
              >
                <BrandMark size={26} />
                <span className="text-[18px] font-bold text-white">{item.label}</span>
              </button>
            );
          })}
        </div>
      {loading ? (
        <BentoGrid
          items={["9:16", "16:9", "9:16", "1:1", "9:16", "16:9", "3:4", "9:16"].map((aspectRatio, index) => ({
            key: `sk-${index}`,
            aspectRatio,
          }))}
          render={() => <VideoCardSkeleton showMeta={false} className="h-full" />}
        />
      ) : (
        <BentoGrid
          items={videos.slice(0, shown).map((video) => ({
            key: video.id,
            aspectRatio: video.aspectRatio,
          }))}
          render={(index) => {
            const video = videos[index];
            const active = spotlight === video.id;
            return (
              <motion.div
                data-video={video.id}
                className={active ? "relative z-20 h-full rounded-[12px] ring-2 ring-yellow" : "h-full"}
                animate={{
                  opacity: spotlight && !active ? 0.45 : 1,
                  scale: active ? 1.04 : 1,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
              >
                <VideoCard
                  video={video}
                  onLike={onLike}
                  onShare={onShare}
                  onRemix={onRemix}
                  remixLabel={walletAddress ? "Remix" : "Connect wallet"}
                  muted={muted && !active}
                  onToggleMute={() => setMuted((on) => !on)}
                  showMeta={false}
                  fill
                  spotlight={active}
                  onEnded={() => setSpotlight(null)}
                  priority={index < 4}
                />
              </motion.div>
            );
          }}
        />
      )}
      <div ref={sentinel} className="h-px" />
      {!loading && shown >= videos.length && <FeedEnd />}
      <HoldGate open={gateOpen} onClose={() => setGateOpen(false)} mint={tokenMint} />
    </div>
  );
}

const END_SPARKS = [
  { left: "4%", top: "-8px", delay: 0 },
  { left: "28%", top: "-12px", delay: 0.4 },
  { left: "52%", top: "-6px", delay: 0.8 },
  { left: "74%", top: "-14px", delay: 0.2 },
  { left: "92%", top: "-8px", delay: 1 },
  { left: "18%", top: "110%", delay: 0.6 },
  { left: "46%", top: "120%", delay: 0.15 },
  { left: "70%", top: "108%", delay: 0.9 },
];

function FeedEnd() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <p className="relative text-center text-[28px] font-bold leading-tight text-white md:text-[36px]">
        Make viral content with <span className="text-yellow">$GENER8</span>.
        {END_SPARKS.map((spark) => (
          <motion.span
            key={`${spark.left}-${spark.top}`}
            aria-hidden
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-yellow shadow-[0_0_8px_#fff176]"
            style={{ left: spark.left, top: spark.top }}
            animate={{ opacity: [0.15, 1, 0.15], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: spark.delay, ease: "easeInOut" }}
          />
        ))}
      </p>
    </div>
  );
}
