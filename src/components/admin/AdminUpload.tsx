"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { apiFetch } from "@/lib/api";
import { isAdminWallet } from "@/lib/admin";

export function AdminUpload() {
  const { walletAddress, loading } = useAppState();
  const { toast } = useToast();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<{ id: string; name: string; avatar: string }[]>([]);

  const loadPending = () => {
    apiFetch("/api/admin/kols")
      .then((res) => res.json())
      .then((data) => setPending(data.kols ?? []))
      .catch(() => undefined);
  };

  useEffect(() => {
    if (isAdminWallet(walletAddress)) loadPending();
  }, [walletAddress]);

  const review = async (id: string, action: "approve" | "deny") => {
    const res = await apiFetch(`/api/admin/kols/${id}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error || "Couldn’t update that KOL.", "error");
      return;
    }
    setPending((current) => current.filter((kol) => kol.id !== id));
  };

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!isAdminWallet(walletAddress)) {
    return <p className="text-sm text-muted">This page is not available.</p>;
  }

  const submit = async () => {
    if (!file) {
      toast("Add a video.", "error");
      return;
    }
    if (prompt.trim().length < 8) {
      toast("Write the remix prompt.", "error");
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("prompt", prompt.trim());
      const res = await apiFetch("/api/admin/discover", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      toast("Added to Discover.", "success");
      setFile(null);
      setPrompt("");
      router.push("/discover");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-[28px] font-semibold tracking-tight">Discover upload</h1>
      <p className="mt-1 text-sm text-muted">
        The video goes on the Discover grid. The prompt is what Remix puts in the composer.
      </p>
      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
        <span className="text-sm font-medium text-white">
          {file ? file.name : "Drop a video or click to choose"}
        </span>
        <span className="mt-1 text-xs text-muted">MP4 or MOV, up to 80 MB</span>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/*"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-white">
        Remix prompt
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          placeholder="What should happen when someone remixes this clip?"
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-normal text-white outline-none focus:border-yellow/50"
        />
      </label>
      <Button className="mt-4" disabled={saving} onClick={() => void submit()}>
        {saving ? "Uploading…" : "Add to Discover"}
      </Button>

      <h2 className="mt-10 text-lg font-semibold">KOL approvals</h2>
      {pending.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No KOLs waiting.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pending.map((kol) => (
            <li key={kol.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kol.avatar} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{kol.name}</p>
              <Button size="sm" onClick={() => void review(kol.id, "approve")}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => void review(kol.id, "deny")}>Deny</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
