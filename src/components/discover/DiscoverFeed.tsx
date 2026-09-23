"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { chatHide } from "@/components/layout/chatMotion";
import { VideoCard } from "./VideoCard";
import { BentoGrid } from "./BentoGrid";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { promptPreview } from "@/lib/format";
import type { VideoWithCreator } from "@/types";
import { apiFetch } from "@/lib/api";
import { HoldGate } from "@/components/token/HoldGate";
import { isAdminWallet } from "@/lib/admin";

const PAGE_SIZE = 8;

export function DiscoverFeed() {
  const { toast } = useToast();
  const { session, walletAddress, eligibility, tokenMint } = useAppState();
  const [gateOpen, setGateOpen] = useState(false);
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [spotlightArmed, setSpotlightArmed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const spotlightStarted = useRef<string | null>(null);
  const spotlightScrolled = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch("/api/videos?filter=trending")
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
  }, [toast]);

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
    spotlightScrolled.current = null;
    setSpotlightArmed(false);
    setShown((count) => Math.max(count, index + 1));
    setSpotlight(shared);
  }, [loading, videos]);

  useEffect(() => {
    if (!spotlight || spotlightScrolled.current === spotlight) return;
    let frame = 0;
    let controls: { stop: () => void } | null = null;
    const start = () => {
      const el = document.querySelector(`[data-video="${spotlight}"]`);
      if (!el) {
        frame = window.requestAnimationFrame(start);
        return;
      }
      spotlightScrolled.current = spotlight;
      const rect = el.getBoundingClientRect();
      const target = Math.max(
        0,
        window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2,
      );
      controls = animate(window.scrollY, target, {
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (value) => window.scrollTo(0, value),
        onComplete: () => setSpotlightArmed(true),
      });
    };
    start();
    return () => {
      window.cancelAnimationFrame(frame);
      controls?.stop();
    };
  }, [spotlight]);

  useEffect(() => {
    if (!spotlight || !spotlightArmed) return;
    let streakStart = 0;
    let last = 0;
    let timer = 0;
    const releaseLater = () => {
      const now = Date.now();
      if (!streakStart || now - last > 500) streakStart = now;
      last = now;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSpotlight(null), Math.max(0, 2500 - (now - streakStart)));
    };
    const onClick = (event: MouseEvent) => {
      const card = document.querySelector(`[data-video="${spotlight}"]`);
      if (card && event.target instanceof Node && card.contains(event.target)) return;
      releaseLater();
    };
    window.addEventListener("mousemove", releaseLater);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("mousemove", releaseLater);
      window.removeEventListener("pointerdown", onClick);
      window.clearTimeout(timer);
    };
  }, [spotlight, spotlightArmed]);

  const feedEnded = !loading && shown >= videos.length;
  useEffect(() => {
    if (!feedEnded) {
      chatHide.set(0);
      return;
    }
    const update = () => {
      const node = endRef.current;
      if (!node) {
        chatHide.set(0);
        return;
      }
      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const middle = window.innerHeight * 0.5;
      const start = window.innerHeight * 0.92;
      const progress = (start - center) / (start - middle);
      chatHide.set(Math.min(1, Math.max(0, progress)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      chatHide.set(0);
    };
  }, [feedEnded]);

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
                  muted={active ? false : muted}
                  suspendHover={Boolean(spotlight) && !active}
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
      {!loading && shown >= videos.length && <FeedEnd ref={endRef} />}
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

const FeedEnd = forwardRef<HTMLDivElement>(function FeedEnd(_, ref) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <p ref={ref} className="relative text-center text-[28px] font-bold leading-tight text-white md:text-[36px]">
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
});
