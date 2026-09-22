"use client";

import { Camera, Pencil, Share2, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { VideoCard } from "@/components/discover/VideoCard";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { abbreviateAddress, formatCount } from "@/lib/format";
import { apiFetch } from "@/lib/api";
import type { User, VideoWithCreator } from "@/types";
import { XLink } from "@/components/brand/XLink";
import { XLogo } from "@/components/brand/XLogo";
import { publicErrorMessage } from "@/lib/errors";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const fieldClass =
  "mt-1.5 flex h-11 items-center rounded-[10px] border border-line bg-elevated px-3";
const inputClass =
  "w-full bg-transparent text-sm text-paper outline-none ring-0 placeholder:text-muted focus:outline-none focus-visible:!outline-none";

export function ProfileView({ username }: { username: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const { session, walletAddress, completeProfile } = useAppState();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [stats, setStats] = useState({
    totalCreations: 0,
    publishedCount: 0,
    totalViews: 0,
  });
  const [following, setFollowing] = useState(false);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    apiFetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          setMissing(true);
          return;
        }
        setUser(data.user);
        setVideos(data.videos ?? []);
        setStats(data.stats);
        setFollowing(Boolean(data.following));
      })
      .catch(() => setMissing(true));
  }, [username]);

  if (missing) {
    return (
      <EmptyState
        title="Creator not found."
        body="That profile doesn’t exist yet."
        actionLabel="Discover videos"
        actionHref="/"
      />
    );
  }

  if (!user) {
    return <p className="text-sm text-muted">Loading profile…</p>;
  }

  const isMe =
    session?.userId === user.id ||
    Boolean(
      walletAddress &&
        user.walletAddress &&
        walletAddress.toLowerCase() === user.walletAddress.toLowerCase(),
    );

  const follow = async () => {
    if (!session) {
      toast("Connect your wallet to follow creators.");
      return;
    }
    const res = await apiFetch(`/api/users/${username}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return toast(data.error, "error");
    setFollowing(data.following);
    setUser((u) =>
      u ? { ...u, followerCount: data.followerCount } : u,
    );
  };

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast("Profile link copied", "success");
  };

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={user.displayName} palette={user.avatarPalette} src={user.avatarUrl} size={72} />
            {isMe && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border border-line bg-elevated text-paper transition-colors hover:border-[#3a3a3a] focus-visible:outline-none"
                aria-label="Change profile image"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.displayName}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>@{user.username}</span>
              <XLink handle={user.xHandle} />
              {user.walletAddress && (
                <span>· {abbreviateAddress(user.walletAddress)}</span>
              )}
            </p>
            {user.bio && (
              <p className="mt-1 max-w-lg text-sm text-paper/80">{user.bio}</p>
            )}
            <div className="mt-3 flex gap-4 text-[13px] text-muted">
              <span>
                <strong className="text-paper">
                  {formatCount(user.followerCount)}
                </strong>{" "}
                followers
              </span>
              <span>
                <strong className="text-paper">
                  {formatCount(stats.publishedCount)}
                </strong>{" "}
                creations
              </span>
              <span>
                <strong className="text-paper">
                  {formatCount(stats.totalViews)}
                </strong>{" "}
                views
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isMe && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          )}
          {!isMe && (
            <Button size="sm" variant={following ? "outline" : "primary"} onClick={() => void follow()}>
              <UserPlus className="h-3.5 w-3.5" />
              {following ? "Following" : "Follow"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => void share()}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={{ ...video, gridSpan: "normal" }} />
        ))}
      </div>
      {videos.length === 0 && (
        <EmptyState
          className="mt-6"
          title="No published work yet."
          body="When this creator publishes, it will show here."
        />
      )}

      {isMe && (
        <EditProfileModal
          open={editing}
          user={user}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            setUser(next);
            setEditing(false);
            if (next.username !== username) {
              router.replace(`/profile/${next.username}`);
            }
          }}
          completeProfile={completeProfile}
          toast={toast}
        />
      )}
    </div>
  );
}

function EditProfileModal({
  open,
  user,
  onClose,
  onSaved,
  completeProfile,
  toast,
}: {
  open: boolean;
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
  completeProfile: (form: FormData) => Promise<User>;
  toast: (message: string, kind?: "info" | "success" | "error") => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(user.username);
  const [xHandle, setXHandle] = useState(user.xHandle ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(user.username);
    setXHandle(user.xHandle ?? "");
    setFile(null);
    setPreview(null);
  }, [open, user]);

  const onFile = (next: File | null) => {
    setFile(next);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const submit = async () => {
    const name = username.trim().replace(/^@/, "");
    if (!USERNAME_RE.test(name)) {
      toast(publicErrorMessage("USERNAME_INVALID"), "error");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.set("username", name);
      form.set("xHandle", xHandle.trim());
      if (user.walletAddress) form.set("wallet", user.walletAddress);
      if (file) form.set("avatar", file);
      const next = await completeProfile(form);
      onSaved(next);
      toast("Profile updated", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : publicErrorMessage("INTERNAL"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-[420px]">
      <h2 className="text-base font-semibold tracking-tight">Edit profile</h2>
      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full border border-line bg-elevated focus-visible:outline-none"
        >
          <Avatar
            name={username || user.displayName}
            palette={user.avatarPalette}
            src={preview ?? user.avatarUrl}
            size={72}
          />
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-paper">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <div>
          <p className="text-sm text-paper">Profile image</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1.5 h-8 rounded-[7px] border border-line bg-elevated px-3 text-xs text-paper transition-colors hover:border-[#3a3a3a] focus-visible:outline-none"
          >
            {file ? file.name : "Choose file"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <label className="mt-5 block">
        <span className="text-[11px] uppercase tracking-wide text-muted">
          Username
        </span>
        <div className={fieldClass}>
          <span className="text-muted">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            className={`ml-1 ${inputClass}`}
          />
        </div>
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] uppercase tracking-wide text-muted">
          X profile
        </span>
        <div className={`${fieldClass} gap-2`}>
          <XLogo className="h-3.5 w-3.5 text-muted" />
          <span className="text-muted">@</span>
          <input
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            maxLength={15}
            className={inputClass}
          />
        </div>
      </label>

      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button className="flex-1" disabled={saving} onClick={() => void submit()}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
