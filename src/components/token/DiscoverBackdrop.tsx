"use client";

import { useEffect, useState } from "react";
import { BentoGrid } from "@/components/discover/BentoGrid";
import { VideoCard } from "@/components/discover/VideoCard";
import { apiFetch } from "@/lib/api";
import type { VideoWithCreator } from "@/types";

function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function fillReel(list: VideoWithCreator[]) {
  if (!list.length) return [];
  const reel: VideoWithCreator[] = [];
  while (reel.length < 18) reel.push(...list);
  return reel.slice(0, Math.max(18, list.length));
}

export function DiscoverBackdrop() {
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/videos?filter=trending")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setVideos(fillReel(shuffle(data.videos ?? [])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!videos.length) return null;

  const items = videos.map((video, index) => ({
    key: `${video.id}-${index}`,
    aspectRatio: video.aspectRatio,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-20">
      <div className="animate-feed-loop px-3">
        {[0, 1].map((copy) => (
          <div key={copy} className="pb-3">
            <BentoGrid
              items={items.map((item) => ({ ...item, key: `${copy}-${item.key}` }))}
              render={(index) => (
                <VideoCard
                  video={videos[index]}
                  showMeta={false}
                  fill
                  muted
                  remixLabel="Remix"
                  onRemix={() => undefined}
                />
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
