"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Share2, Shuffle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VideoPoster } from "@/components/video/VideoPoster";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { displayModelName } from "@/lib/config/models";
import {
  abbreviateAddress,
  formatCount,
  formatRelativeTime,
} from "@/lib/format";
import type { VideoWithCreator } from "@/types";
import { apiFetch, mediaUrl } from "@/lib/api";
import { XLink } from "@/components/brand/XLink";

export function VideoDetail({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { session } = useAppState();
  const [video, setVideo] = useState<VideoWithCreator | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    apiFetch(`/api/videos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.video) setMissing(true);
        else setVideo(data.video);
      })
      .catch(() => setMissing(true));
    apiFetch(`/api/videos/${id}/view`, { method: "POST" }).catch(() => undefined);
  }, [id]);

  if (missing) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-semibold">That creation couldn’t be found.</h1>
        <Link href="/discover" className="mt-3 inline-block text-sm text-yellow">
          Back to Discover
        </Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="aspect-video animate-shimmer rounded-[14px] bg-elevated" />
      </div>
    );
  }

  const promptText =
    video.publicPrompt || video.userId === session?.userId
      ? video.prompt
      : "The creator hid this prompt.";

  const like = async () => {
    if (!session) {
      toast("Connect your wallet to like a video.");
      return;
    }
    const res = await apiFetch(`/api/videos/${id}/like`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return toast(data.error, "error");
    setVideo((v) =>
      v ? { ...v, likes: data.likes, likedByMe: data.liked } : v,
    );
  };

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast("Link copied", "success");
  };

  const frame =
    video.aspectRatio === "9:16"
      ? "mx-auto aspect-[9/16] max-h-[78vh] w-full max-w-[420px]"
      : video.aspectRatio === "1:1"
        ? "mx-auto aspect-square w-full max-w-[720px]"
        : "aspect-video w-full";

  return (
    <div className="mx-auto max-w-5xl">
      <div
        className={`relative overflow-hidden rounded-[14px] border border-line bg-black ${frame}`}
      >
        {mediaUrl(video.videoUrl) ? (
          <video
            src={mediaUrl(video.videoUrl) ?? undefined}
            className="absolute inset-0 h-full w-full object-cover object-center"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <VideoPoster palette={video.poster} title={video.title} />
        )}
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_280px]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{video.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <Link href={`/profile/${video.creator.username}`}>
              <Avatar
                name={video.creator.displayName}
                palette={video.creator.avatarPalette}
                src={video.creator.avatarUrl}
                size={40}
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${video.creator.username}`}
                  className="text-sm font-medium hover:text-yellow"
                >
                  {video.creator.displayName || video.creator.username}
                </Link>
                <XLink handle={video.creator.xHandle} />
              </div>
              <p className="text-xs text-muted">
                {video.creator.walletAddress
                  ? abbreviateAddress(video.creator.walletAddress)
                  : ""}
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-[12px] border border-line bg-surface p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Generation prompt
            </p>
            <p className="mt-2 text-sm leading-relaxed text-paper/90">
              {promptText}
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={video.likedByMe ? "primary" : "outline"}
              size="sm"
              onClick={() => void like()}
            >
              <Heart
                className={`h-3.5 w-3.5 ${video.likedByMe ? "fill-ink" : ""}`}
              />
              {formatCount(video.likes)}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void share()}>
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/create?remix=${video.id}`)}
            >
              <Shuffle className="h-3.5 w-3.5" />
              Remix
            </Button>
          </div>
          <dl className="space-y-2.5 rounded-[12px] border border-line bg-surface p-4 text-sm">
            <Row label="Model" value={displayModelName(video.model)} />
            <Row label="Duration" value={`${video.duration}s`} />
            <Row label="Aspect" value={video.aspectRatio} />
            <Row label="Generated" value={formatRelativeTime(video.createdAt)} />
            <Row label="Views" value={formatCount(video.views)} />
            <Row label="Likes" value={formatCount(video.likes)} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-paper">{value}</dd>
    </div>
  );
}
