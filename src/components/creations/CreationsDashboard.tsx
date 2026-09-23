"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  Shuffle,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { BrandMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { aspectWeight, packColumns, useColumnCount } from "@/components/discover/masonry";
import { GeneratingPoster } from "@/components/creations/GeneratingPoster";
import { VideoThumb } from "@/components/video/VideoThumb";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { WalletButton } from "@/components/wallet/WalletButton";
import { apiFetch, mediaUrl } from "@/lib/api";
import { formatCount, formatRelativeTime, promptPreview } from "@/lib/format";
import type { CreationsTab, VideoWithCreator } from "@/types";

const TABS: { id: CreationsTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "private", label: "Private" },
  { id: "generating", label: "Generating" },
  { id: "archived", label: "Archived" },
];

export function CreationsDashboard() {
  const { session, loading } = useAppState();
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<CreationsTab>("all");
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [fetching, setFetching] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<VideoWithCreator | null>(null);
  const columns = useColumnCount();

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let first = true;
    const load = () => {
      if (first) setFetching(true);
      apiFetch(`/api/me/videos?tab=${tab}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setVideos(data.videos ?? []);
        })
        .catch(() => {
          if (!cancelled && first) toast("Couldn’t load your creations.", "error");
        })
        .finally(() => {
          if (!cancelled) {
            setFetching(false);
            first = false;
          }
        });
    };
    load();
    const generating = tab === "generating" || tab === "all";
    const timer = generating ? window.setInterval(load, 4000) : undefined;
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [session, tab, toast]);

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!session) {
    return (
      <div>
        <EmptyState
          className="mt-6"
          title="Your ideas will appear here."
          body="Connect a Solana wallet to see everything you’ve generated."
        />
        <div className="mt-4 flex justify-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  const action = async (id: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch {
      toast("That action didn’t go through.", "error");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
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
      {fetching && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!fetching && videos.length === 0 && (
        <EmptyState
          className="mt-6"
          title="Nothing generated yet."
          body="Your private studio is empty. Make the first cut."
          actionLabel="Create your first video"
          actionHref="/create"
        />
      )}
      <div className="mt-3 flex items-start gap-3">
        {packColumns(videos, columns, (video) => aspectWeight(video.aspectRatio)).map(
          (column, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-3">
        {column.map((video, index) => (
          <article
            key={video.id}
            className="flex flex-col overflow-hidden rounded-[12px] border border-line bg-surface"
          >
            <Link
              href={`/video/${video.id}`}
              className={`relative block w-full overflow-hidden bg-ink ${tileAspect(video.aspectRatio)}`}
            >
              {isGenerating(video.status) ? (
                <GeneratingPoster />
              ) : (
                <VideoThumb
                  videoUrl={video.videoUrl}
                  thumbnailUrl={video.thumbnailUrl}
                  poster={video.poster}
                  priority={index < 3}
                />
              )}
              {!isGenerating(video.status) && (
                <StatusPill status={video.status} visibility={video.visibility} />
              )}
            </Link>
            <div className="flex flex-1 flex-col p-3">
              <Link
                href={`/video/${video.id}`}
                className="line-clamp-2 text-sm font-medium hover:text-yellow"
              >
                {video.title || promptPreview(video.prompt)}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-muted">
                {promptPreview(video.prompt, 90)}
              </p>
              <p className="mt-2 text-[11px] text-muted">
                {formatRelativeTime(video.createdAt)} · {formatCount(video.views)}{" "}
                views · {formatCount(video.likes)} likes
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/video/${video.id}`)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                {video.status === "complete" && (
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      const next = video.visibility === "public" ? "private" : "public";
                      setVideos((prev) =>
                        prev.map((v) =>
                          v.id === video.id ? { ...v, visibility: next } : v,
                        ),
                      );
                      void action(video.id, async () => {
                        const res = await apiFetch(`/api/videos/${video.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ visibility: next }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error();
                        setVideos((prev) =>
                          prev.map((v) => (v.id === video.id ? data.video : v)),
                        );
                      }).catch(() => {
                        setVideos((prev) =>
                          prev.map((v) =>
                            v.id === video.id ? { ...v, visibility: video.visibility } : v,
                          ),
                        );
                      });
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {video.visibility === "public" ? "Unpublish" : "Publish"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/create?remix=${video.id}`)}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  Remix
                </Button>
                {mediaUrl(video.videoUrl) && (
                  <a href={mediaUrl(video.videoUrl) ?? undefined} download>
                    <Button variant="ghost" size="sm">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </a>
                )}
                {tab !== "archived" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setPendingArchive(video)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
          </div>
        ))}
      </div>
      <Modal open={pendingArchive !== null} onClose={() => setPendingArchive(null)}>
        <h2 className="text-lg font-semibold text-white">Archive this video?</h2>
        <p className="mt-2 text-sm text-muted">
          It leaves Discover and your profile. You can still open it under Archived.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPendingArchive(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              const video = pendingArchive;
              if (!video) return;
              setPendingArchive(null);
              void action(video.id, async () => {
                const res = await apiFetch(`/api/videos/${video.id}`, { method: "DELETE" });
                if (!res.ok) throw new Error();
                setVideos((prev) => prev.filter((item) => item.id !== video.id));
              });
            }}
          >
            Archive
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function tileAspect(ratio: string) {
  if (ratio === "9:16") return "aspect-[9/16]";
  if (ratio === "1:1") return "aspect-square";
  if (ratio === "3:4") return "aspect-[3/4]";
  if (ratio === "4:3") return "aspect-[4/3]";
  return "aspect-video";
}

function isGenerating(status: string) {
  return ["queued", "preparing", "generating", "processing"].includes(status);
}

function StatusPill({
  status,
  visibility,
}: {
  status: string;
  visibility: string;
}) {
  const generating = ["queued", "preparing", "generating", "processing"].includes(
    status,
  );
  const label = generating
    ? "Generating"
    : status === "failed"
      ? "Failed"
      : visibility === "public"
        ? "Published"
        : "Private";
  return (
    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-yellow">
      {label}
    </span>
  );
}
