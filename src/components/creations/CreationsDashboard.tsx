"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { BrandMark } from "@/components/brand/Logo";
import { BentoGrid } from "@/components/discover/BentoGrid";
import { VideoCard } from "@/components/discover/VideoCard";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { WalletButton } from "@/components/wallet/WalletButton";
import { HoldGate } from "@/components/token/HoldGate";
import { isAdminWallet } from "@/lib/admin";
import { apiFetch } from "@/lib/api";
import { promptPreview } from "@/lib/format";
import type { CreationsTab, VideoWithCreator } from "@/types";

const TABS: { id: CreationsTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "private", label: "Private" },
  { id: "generating", label: "Generating" },
  { id: "archived", label: "Archived" },
];

export function CreationsDashboard() {
  const { session, loading, walletAddress, eligibility, tokenMint } = useAppState();
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<CreationsTab>("all");
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [fetching, setFetching] = useState(true);
  const [pendingArchive, setPendingArchive] = useState<VideoWithCreator | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let first = true;
    const load = () => {
      if (first) setFetching(true);
      apiFetch(`/api/me/videos?tab=${tab}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) {
            const list: VideoWithCreator[] = [...(data.videos ?? [])].sort(
              (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
            );
            setVideos(list);
          }
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

  if (loading || (session && fetching)) {
    return <CreationsLoader />;
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="flex flex-wrap justify-center gap-3">
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
      {!fetching && videos.length === 0 && (
        <EmptyState
          className="mt-6"
          title="Nothing generated yet."
          body="Your private studio is empty. Make the first cut."
          actionLabel="Create your first video"
          actionHref="/create"
        />
      )}
      <div className="mt-3">
        <BentoGrid
          items={videos.map((video) => ({ key: video.id, aspectRatio: video.aspectRatio }))}
          render={(index) => {
            const video = videos[index];
            const generating = isGenerating(video.status);
            return (
              <VideoCard
                video={video}
                showMeta={false}
                fill
                generating={generating}
                priority={index < 4}
                published={video.visibility === "public"}
                onTogglePublish={
                  video.status === "complete"
                    ? () => {
                        const next = video.visibility === "public" ? "private" : "public";
                        setVideos((prev) =>
                          prev.map((item) =>
                            item.id === video.id ? { ...item, visibility: next } : item,
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
                            prev.map((item) => (item.id === video.id ? data.video : item)),
                          );
                        }).catch(() => {
                          setVideos((prev) =>
                            prev.map((item) =>
                              item.id === video.id ? { ...item, visibility: video.visibility } : item,
                            ),
                          );
                        });
                      }
                    : undefined
                }
                onRemix={
                  generating
                    ? undefined
                    : () => {
                        const holds =
                          isAdminWallet(walletAddress) ||
                          eligibility?.state === "eligible" ||
                          eligibility?.state === "limit_reached";
                        if (!holds) {
                          setGateOpen(true);
                          return;
                        }
                        sessionStorage.setItem(
                          "gener8:pending-remix",
                          JSON.stringify({
                            videoUrl: video.videoUrl,
                            thumbnailUrl: video.thumbnailUrl,
                            duration: video.duration,
                            aspectRatio: video.aspectRatio,
                            title: video.title || promptPreview(video.prompt, 60),
                            prompt: video.prompt,
                            id: video.id,
                          }),
                        );
                        router.push("/discover");
                      }
                }
                onArchive={tab === "archived" ? undefined : () => setPendingArchive(video)}
              />
            );
          }}
        />
      </div>
      <HoldGate open={gateOpen} onClose={() => setGateOpen(false)} mint={tokenMint} />
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
    </motion.div>
  );
}

function CreationsLoader() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <BrandMark size={84} />
      </motion.div>
      <p className="mt-4 text-sm font-semibold tracking-wide text-white/70">Loading</p>
    </div>
  );
}

function isGenerating(status: string) {
  return ["queued", "preparing", "generating", "processing"].includes(status);
}

