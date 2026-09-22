"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wallet, Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VideoCard } from "@/components/discover/VideoCard";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { apiFetch } from "@/lib/api";
import type { VideoWithCreator } from "@/types";

const PREVIEW_COUNT = 4;
const ORDER_KEY = "gener8_discover_order";

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

const STEPS = [
  {
    icon: Wallet,
    title: "Hold GENER8",
    body: "Connect a Solana wallet that holds GENER8. Access is hold-to-use — nothing is spent or burned to generate.",
  },
  {
    icon: Sparkles,
    title: "Generate video",
    body: "Write a prompt, pick a model, and Gener8 turns it into a clip. Keep generations private or publish them.",
  },
  {
    icon: Compass,
    title: "Put it on the feed",
    body: "Public clips land on Discover. Hover to play, open a video, remix a prompt, and see what the studio is making.",
  },
];

export function LandingPage() {
  const { toast } = useToast();
  const { session } = useAppState();
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/videos?filter=trending")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        let list: VideoWithCreator[] = data.videos ?? [];
        try {
          const raw = localStorage.getItem(ORDER_KEY);
          const ids = raw ? (JSON.parse(raw) as unknown) : null;
          if (Array.isArray(ids)) {
            list = orderByIds(
              list,
              ids.filter((id): id is string => typeof id === "string"),
            );
          }
        } catch {
          /* keep api order */
        }
        // Portrait clips only so every tile is a full 9:16 frame — no
        // letterboxed landscape sitting in a tall cell.
        setVideos(
          list
            .filter((video) => video.aspectRatio === "9:16")
            .slice(0, PREVIEW_COUNT),
        );
      })
      .catch(() => toast("Couldn’t load clips.", "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

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

  return (
    <div>
      <section className="max-w-3xl pb-4 pt-6 md:pt-14">
        <p className="text-[11px] uppercase tracking-[0.18em] text-yellow">
          Hold GENER8 → create
        </p>
        <h1 className="mt-3 text-[36px] font-semibold leading-[1.05] tracking-tight text-paper md:text-[56px]">
          Video generation
          <br />
          made <span className="text-yellow">easy.</span>
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted md:text-[17px]">
          Gener8 is a token-gated AI video studio. Hold GENER8 in your wallet,
          generate cinematic clips from a prompt, and publish them to a public
          feed.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/create">
            <Button size="lg">Create a video</Button>
          </Link>
          <Link href="/discover">
            <Button size="lg" variant="outline">
              Discover
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-3 md:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <article
              key={step.title}
              className="rounded-[14px] border border-line bg-surface p-5"
            >
              <Icon className="h-5 w-5 text-yellow" strokeWidth={1.75} />
              <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-paper">
                {step.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {step.body}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight text-paper">
              From the feed
            </h2>
            <p className="mt-1 text-sm text-muted">
              A few clips. Hover to play.
            </p>
          </div>
          <Link
            href="/discover"
            className="shrink-0 text-[13px] font-medium text-yellow hover:text-yellow-bright"
          >
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-4 md:gap-4">
          {loading &&
            Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
              <VideoCardSkeleton key={i} portrait showMeta={false} />
            ))}
          {!loading &&
            videos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={{ ...video, gridSpan: "normal", aspectRatio: "9:16" }}
                onLike={onLike}
                onShare={onShare}
                muted={muted}
                onToggleMute={() => setMuted((on) => !on)}
                showMeta={false}
                priority={index < 4}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
