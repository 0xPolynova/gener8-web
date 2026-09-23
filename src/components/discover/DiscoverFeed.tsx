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
import { aspectWeight, packColumns, useColumnCount } from "./masonry";
import { HoldGate } from "@/components/token/HoldGate";
import { isAdminWallet } from "@/lib/admin";

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
  const columns = useColumnCount();

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
      <div className="flex items-start gap-3">
        {(loading
          ? packColumns(
              Array.from({ length: 8 }, (_, i) => i),
              columns,
              (i) => (i % 3 === 1 ? 16 / 9 : 9 / 16),
            )
          : packColumns(videos, columns, (video) => aspectWeight(video.aspectRatio))
        ).map((column, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-3">
            {loading
              ? column.map((i) => (
                  <VideoCardSkeleton key={i as number} tall={(i as number) % 3 === 1} showMeta={false} />
                ))
              : (column as VideoWithCreator[]).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={{ ...video, gridSpan: discoverSpan(video.gridSpan) }}
                    onLike={onLike}
                    onShare={onShare}
                    onRemix={onRemix}
                    remixLabel={walletAddress ? "Remix" : "Connect wallet"}
                    muted={muted}
                    onToggleMute={() => setMuted((on) => !on)}
                    showMeta={false}
                    priority={videos.indexOf(video) < 4}
                  />
                ))}
          </div>
        ))}
      </div>
      {!loading && videos.length === 0 && (
        <EmptyState
          className="mt-6"
          title="No creations found."
          body="Nothing in the feed yet — write a prompt above to be the first."
        />
      )}
      <HoldGate open={gateOpen} onClose={() => setGateOpen(false)} mint={tokenMint} />
    </div>
  );
}
