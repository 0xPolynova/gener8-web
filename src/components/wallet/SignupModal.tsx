"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAppState } from "@/components/providers/AppState";
import { useToast } from "@/components/ui/Toast";
import { XLogo } from "@/components/brand/XLogo";
import { publicErrorMessage } from "@/lib/errors";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const fieldClass =
  "mt-1.5 flex h-11 items-center rounded-[10px] border border-line bg-elevated px-3 focus-within:border-line";
const inputClass =
  "w-full bg-transparent text-sm text-paper outline-none ring-0 placeholder:text-muted focus:outline-none focus-visible:!outline-none";

export function SignupModal() {
  const { user, walletAddress, loading, connecting, needsOnboarding, completeProfile, signOut } =
    useAppState();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading || connecting || !needsOnboarding || !walletAddress) return null;

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
      form.set("wallet", walletAddress);
      form.set("username", name);
      form.set("xHandle", xHandle.trim());
      if (file) form.set("avatar", file);
      await completeProfile(form);
      toast("You’re in.", "success");
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
    <Modal open onClose={() => undefined} className="max-w-[420px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-yellow">
        New account
      </p>
      <p className="mt-2 text-sm text-muted">
        This is how you show up on Discover. You can add a photo and X so people can find you.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full border border-line bg-elevated focus-visible:outline-none"
        >
          <Avatar
            name={username || user?.displayName || walletAddress}
            palette={user?.avatarPalette}
            src={preview ?? user?.avatarUrl}
            size={72}
          />
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-paper opacity-0 transition-opacity hover:opacity-100">
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
            placeholder="yourname"
            maxLength={20}
            className={`ml-1 ${inputClass}`}
            autoFocus
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
            placeholder="handle"
            maxLength={15}
            className={inputClass}
          />
        </div>
      </label>

      <Button className="mt-5 w-full" size="lg" disabled={saving} onClick={() => void submit()}>
        {saving ? "Saving…" : "Sign up"}
      </Button>
      <button
        type="button"
        className="mt-3 w-full text-center text-xs text-muted hover:text-paper focus-visible:outline-none"
        onClick={() => void signOut()}
      >
        Disconnect wallet
      </button>
    </Modal>
  );
}
