"use client";

import { useEffect, useState } from "react";
import { VideoCard } from "./VideoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { promptPreview } from "@/lib/format";
import { BrandMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { DiscoverFilter, GridSpan, VideoWithCreator } from "@/types";
import { apiFetch } from "@/lib/api";

const ORDER_KEY = "gener8_discover_order";

function discoverSpan(span?: GridSpan): GridSpan {
  if (span === "wide") return "normal";
  return span ?? "normal";
}

function orderByIds<T extends { id: string }>(list: T[], ids: string[]): T[] {
  const map = new Map(list.map((item) => [item.id, item]));
  const used = new Set<string>();
  const ordered: T[] = [];
  for (const id of ids) {
    const item = map.get(id);
    if (item) {
      ordered.push(item);
      used.add(id);
    }
  }
  for (const item of list) {
    if (!used.has(item.id)) ordered.push(item);
  }
  return ordered;
}

function readSavedOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    const ids = JSON.parse(raw) as unknown;
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : null;
  } catch {
    return null;
  }
}

const FILTERS: { id: DiscoverFilter; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "viral", label: "viral" },
  { id: "tokens", label: "tokens" },
  { id: "memecoins", label: "memecoins" },
  { id: "pnl", label: "P&L" },
  { id: "music", label: "music" },
];

export function DiscoverFeed() {
  const { toast } = useToast();
  const { session } = useAppState();
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [filter, setFilter] = useState<DiscoverFilter>("trending");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/videos?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        let list: VideoWithCreator[] = data.videos ?? [];
        const saved = readSavedOrder();
        if (saved?.length) list = orderByIds(list, saved);
        setVideos(list);
      })
      .catch(() => toast("Couldn’t load the feed. Try again.", "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast, filter]);

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
    const url = `${window.location.origin}/video/${id}`;
    await navigator.clipboard.writeText(url);
    toast("Link copied", "success");
  };

  const onRemix = (video: VideoWithCreator) => {
    window.dispatchEvent(
      new CustomEvent("omni:remix", {
        detail: {
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          title: video.title || promptPreview(video.prompt, 60),
          id: video.id,
        },
      }),
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-paper">
          Discover
        </h1>
        <p className="mt-1 text-sm text-muted">
          Discover generated videos. Hover to play.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = item.id === filter;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                  active
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8",
                )}
              >
                <BrandMark size={18} />
                <span className="text-[14px] font-bold text-white">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:auto-rows-[220px]">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} tall={i % 3 === 1} showMeta={false} />
          ))}
        {!loading &&
          videos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={{ ...video, gridSpan: discoverSpan(video.gridSpan) }}
              onLike={onLike}
              onShare={onShare}
              onRemix={onRemix}
              muted={muted}
              onToggleMute={() => setMuted((on) => !on)}
              showMeta={false}
              priority={index < 4}
            />
          ))}
      </div>
      {!loading && videos.length === 0 && (
        <EmptyState
          className="mt-6"
          title="No creations found."
          body="Nothing in the feed yet — write a prompt above to be the first."
        />
      )}
    </div>
  );
}
