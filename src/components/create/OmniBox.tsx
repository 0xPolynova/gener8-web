"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import { chatHide } from "@/components/layout/chatMotion";
import { X, Plus, Sparkles, Settings2, Users } from "lucide-react";
import { apiFetch, mediaUrl } from "@/lib/api";
import { useAppState } from "@/components/providers/AppState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { KolPicker, KOLS, findKol, type Kol } from "./KolPicker";
import { StylePicker } from "./StylePicker";

interface OmniMedia {
  id: string;
  type: "image" | "video";
  localUrl: string;
  thumbUrl: string | null;
  uploadedUrl: string | null;
  label: string;
  uploading: boolean;
}

interface OmniSettings {
  ratio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  duration: number;
}

interface RemixVideo {
  url: string;
  thumbnailUrl: string | null;
  duration: number;
  aspectRatio: OmniSettings["ratio"];
  title: string;
  id: string;
  label: string;
}

const RATIOS: OmniSettings["ratio"][] = ["16:9", "4:3", "1:1", "3:4", "9:16"];

const CHAT_SPARKS: {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  delay: number;
  size: number;
}[] = [
  { left: "4%", top: "-5px", delay: 0.1, size: 3 },
  { left: "18%", top: "-8px", delay: 0.6, size: 2 },
  { left: "36%", top: "-4px", delay: 1.1, size: 3 },
  { left: "54%", top: "-7px", delay: 0.3, size: 2 },
  { left: "72%", top: "-5px", delay: 0.9, size: 3 },
  { left: "88%", top: "-8px", delay: 1.4, size: 2 },
  { left: "-5px", top: "30%", delay: 0.4, size: 3 },
  { left: "-4px", top: "62%", delay: 1.2, size: 2 },
  { right: "-5px", top: "24%", delay: 0.8, size: 2 },
  { right: "-4px", top: "68%", delay: 0.2, size: 3 },
  { left: "10%", bottom: "-6px", delay: 1.0, size: 2 },
  { left: "28%", bottom: "-4px", delay: 0.5, size: 3 },
  { left: "46%", bottom: "-7px", delay: 1.5, size: 2 },
  { left: "64%", bottom: "-5px", delay: 0.7, size: 3 },
  { left: "82%", bottom: "-8px", delay: 1.3, size: 2 },
];

function ChatAura() {
  return (
    <div className="pointer-events-none absolute -inset-3 -z-10">
      <div className="animate-glow absolute inset-2 rounded-[28px] bg-yellow/30 blur-2xl" />
      <div className="absolute inset-x-8 bottom-0 top-4 rounded-full bg-yellow-bright/15 blur-3xl" />
      {CHAT_SPARKS.map((spark) => (
        <motion.span
          key={`${spark.left ?? ""}-${spark.right ?? ""}-${spark.top ?? spark.bottom}`}
          aria-hidden
          className="absolute rounded-full bg-yellow shadow-[0_0_8px_#fff176]"
          style={{
            left: spark.left,
            right: spark.right,
            top: spark.top,
            bottom: spark.bottom,
            width: spark.size,
            height: spark.size,
          }}
          animate={{ opacity: [0.15, 0.95, 0.15], scale: [0.6, 1.15, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: spark.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

let imgSeq = 0;
let vidSeq = 0;

const REMIX_LABEL = "Video1";
let remixReserved = false;

function nextLabel(type: "image" | "video") {
  if (type === "image") return `Image${++imgSeq}`;
  let label = `Video${++vidSeq}`;
  while (remixReserved && label === REMIX_LABEL) label = `Video${++vidSeq}`;
  return label;
}

function frameFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  return new Promise((resolve) => {
    const finish = (value: string | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onerror = () => finish(null);
    video.onloadeddata = () => {
      const draw = () => {
        if (!video.videoWidth) {
          finish(null);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const width = video.videoWidth * scale;
        const height = video.videoHeight * scale;
        ctx.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        finish(canvas.toDataURL("image/jpeg", 0.82));
      };
      if (Number.isFinite(video.duration) && video.duration > 0.3) {
        video.onseeked = draw;
        video.currentTime = 0.2;
      } else {
        draw();
      }
    };
  });
}

function remixTemplate(videoLabel: string, extras: string[]) {
  const swaps = extras.length ? ` ${extras.join(" ")}` : "";
  return `@${videoLabel} is the video we are recreating exactly.\n\nWe want to swap out the characters for:${swaps}`;
}

function tokenSelector(token: string) {
  const safe = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(token) : token;
  return `[data-token="${safe}"]`;
}

function serializeEditor(root: HTMLElement): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.token) {
      out += node.dataset.token;
      return;
    }
    if (node.tagName === "BR") {
      out += "\n";
      return;
    }
    node.childNodes.forEach(walk);
    if ((node.tagName === "DIV" || node.tagName === "P") && !out.endsWith("\n")) out += "\n";
  };
  root.childNodes.forEach(walk);
  return out.replace(/\u00a0/g, " ").replace(/\n+$/g, "").trim();
}

function makeChip(token: string, imageUrl: string | null, display?: string, thin?: string) {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.dataset.token = token;
  span.className =
    "mx-0.5 inline-flex items-center gap-1 align-middle rounded-full border border-yellow/30 bg-yellow/10 py-0.5 pl-0.5 pr-1.5 text-[13px] font-medium leading-none text-yellow select-none";
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    img.draggable = false;
    img.className = "h-5 w-5 rounded-full object-cover";
    span.appendChild(img);
  }
  const label = document.createElement("span");
  label.textContent = display ?? token;
  span.appendChild(label);
  if (thin) {
    const extra = document.createElement("span");
    extra.textContent = thin;
    extra.className = "font-thin tracking-wide text-yellow/80";
    span.appendChild(extra);
  }
  return span;
}

function insertChip(
  editor: HTMLElement,
  token: string,
  imageUrl: string | null,
  display?: string,
  thin?: string,
  atEnd = false,
) {
  if (editor.querySelector(tokenSelector(token))) return;
  const chip = makeChip(token, imageUrl, display, thin);
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createTextNode(" "));
  frag.appendChild(chip);
  frag.appendChild(document.createTextNode(" "));

  const sel = window.getSelection();
  const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  if (!atEnd && range && editor.contains(range.startContainer)) {
    range.deleteContents();
    range.insertNode(frag);
  } else {
    editor.appendChild(frag);
  }
  const after = document.createRange();
  after.setStartAfter(chip);
  after.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(after);
  editor.focus();
}

function removeChip(editor: HTMLElement, token: string) {
  editor.querySelectorAll(tokenSelector(token)).forEach((el) => el.remove());
}

function mentionAtCaret(editor: HTMLElement): { query: string; node: Text; at: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.startContainer)) return null;
  if (range.startContainer.nodeType !== Node.TEXT_NODE) return null;
  const node = range.startContainer as Text;
  const before = (node.textContent ?? "").slice(0, range.startOffset);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  const query = before.slice(at + 1);
  if (/\s/.test(query)) return null;
  return { query, node, at };
}

function fillEditor(editor: HTMLElement, text: string, images: Record<string, string | null>) {
  editor.replaceChildren();
  for (const part of text.split(/(@[A-Za-z0-9_]+)/g)) {
    if (!part) continue;
    if (part.startsWith("@")) editor.appendChild(makeChip(part, images[part] ?? null));
    else editor.appendChild(document.createTextNode(part));
  }
}

export function OmniBox() {
  const { session, eligibility } = useAppState();
  const { toast } = useToast();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingStyles = useRef<{ kolId: string; handle: string; style: string; imageUrl: string }[]>([]);
  const mentionRef = useRef<HTMLDivElement>(null);
  const kolButtonRef = useRef<HTMLButtonElement>(null);
  const mentionAnchor = useRef<{ node: Text; at: number; len: number } | null>(null);
  const selectedKolsRef = useRef<string[]>([]);
  const mediaRef = useRef<OmniMedia[]>([]);

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [media, setMedia] = useState<OmniMedia[]>([]);
  const [remix, setRemix] = useState<RemixVideo | null>(null);
  const [settings, setSettings] = useState<OmniSettings>({ ratio: "16:9", duration: 15 });
  const [showSettings, setShowSettings] = useState(false);
  const [showKols, setShowKols] = useState(false);
  const [styleKol, setStyleKol] = useState<Kol | null>(null);
  const [styleMode, setStyleMode] = useState<"new" | "community">("new");
  const [styleSession, setStyleSession] = useState(0);
  const [selectedKols, setSelectedKols] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const remaining = eligibility?.remainingToday ?? eligibility?.dailyLimit ?? 0;
  const chatY = useTransform(chatHide, [0, 1], [0, 520]);
  selectedKolsRef.current = selectedKols;
  mediaRef.current = media;

  const syncEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = serializeEditor(editor);
    setPrompt(next);
    const tokens = new Set(
      [...editor.querySelectorAll<HTMLElement>("[data-token]")].map((el) => el.dataset.token),
    );
    setSelectedKols((prev) => {
      const filtered = prev.filter((h) => tokens.has(`@${h}`));
      return filtered.length === prev.length ? prev : filtered;
    });
    setMedia((prev) => {
      const filtered = prev.filter(
        (m) => tokens.has(`@${m.label}`) || Boolean(m.uploadedUrl && next.includes(m.uploadedUrl)),
      );
      if (filtered.length === prev.length) return prev;
      prev
        .filter((m) => !filtered.includes(m) && m.localUrl.startsWith("blob:"))
        .forEach((m) => URL.revokeObjectURL(m.localUrl));
      return filtered;
    });
  }, []);

  /* Close settings on outside click */
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettings]);

  const refreshMention = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const hit = mentionAtCaret(editor);
    if (!hit) {
      setMentionQuery(null);
      mentionAnchor.current = null;
      return;
    }
    mentionAnchor.current = { node: hit.node, at: hit.at, len: hit.query.length };
    setMentionQuery(hit.query);
  }, []);

  useEffect(() => {
    if (mentionQuery === null) return;
    const onDown = (e: MouseEvent) => {
      if (mentionRef.current?.contains(e.target as Node)) return;
      setMentionQuery(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [mentionQuery]);

  useEffect(() => {
    if (!showKols) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (kolButtonRef.current?.contains(target)) return;
      if (document.getElementById("kol-picker-panel")?.contains(target)) return;
      if (document.getElementById("style-picker-panel")?.contains(target)) return;
      if (document.getElementById("style-hover-menu")?.contains(target)) return;
      setShowKols(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showKols]);

  useEffect(() => {
    if (!styleKol) return;
    const onDown = (e: MouseEvent) => {
      if (document.getElementById("style-picker-panel")?.contains(e.target as Node)) return;
      setStyleKol(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [styleKol]);

  /* Listen for remix events */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        videoUrl: string;
        thumbnailUrl: string | null;
        duration: number;
        aspectRatio?: OmniSettings["ratio"];
        title: string;
        prompt?: string;
        id: string;
      };
      const label = REMIX_LABEL;
      remixReserved = true;
      const ratio = RATIOS.includes(detail.aspectRatio as OmniSettings["ratio"])
        ? (detail.aspectRatio as OmniSettings["ratio"])
        : "16:9";
      const remixData: RemixVideo = {
        url: detail.videoUrl,
        thumbnailUrl: detail.thumbnailUrl,
        duration: detail.duration,
        aspectRatio: ratio,
        title: detail.title,
        id: detail.id,
        label,
      };
      setRemix(remixData);
      setSettings((s) => ({ ...s, duration: detail.duration, ratio }));
      const editor = editorRef.current;
      if (editor) {
        const images: Record<string, string | null> = {
          [`@${label}`]: detail.thumbnailUrl,
        };
        for (const handle of selectedKolsRef.current) {
          images[`@${handle}`] = findKol(handle)?.avatar ?? null;
        }
        for (const item of mediaRef.current) images[`@${item.label}`] = item.thumbUrl;
        const extras = [
          ...selectedKolsRef.current.map((h) => `@${h}`),
          ...mediaRef.current.map((m) => `@${m.label}`),
        ];
        const text = remixTemplate(label, extras);
        fillEditor(editor, text, images);
        setPrompt(serializeEditor(editor));
        editor.focus();
      }
    };
    const pending = sessionStorage.getItem("gener8:pending-remix");
    if (pending) {
      sessionStorage.removeItem("gener8:pending-remix");
      try {
        handler(new CustomEvent("omni:remix", { detail: JSON.parse(pending) }));
      } catch {
        /* ignore a bad stored remix */
      }
    }
    window.addEventListener("omni:remix", handler);
    return () => window.removeEventListener("omni:remix", handler);
  }, []);

  const clearRemix = () => {
    remixReserved = false;
    setRemix(null);
    const editor = editorRef.current;
    if (!editor) {
      setPrompt("");
      return;
    }
    const images: Record<string, string | null> = {};
    for (const handle of selectedKolsRef.current) {
      images[`@${handle}`] = findKol(handle)?.avatar ?? null;
    }
    for (const item of mediaRef.current) images[`@${item.label}`] = item.thumbUrl;
    const text = [
      ...selectedKolsRef.current.map((h) => `@${h}`),
      ...mediaRef.current.map((m) => `@${m.label}`),
    ].join(" ");
    fillEditor(editor, text, images);
    setPrompt(serializeEditor(editor));
  };

  const useStyleImage = (pick: { url: string; style: string; source: "new" | "community" }) => {
    const kol = styleKol;
    const apply = (url: string) => {
      setMedia((prev) => {
        if (prev.some((item) => item.uploadedUrl === url)) return prev;
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "image" as const,
            localUrl: url,
            thumbUrl: url,
            uploadedUrl: url,
            label: nextLabel("image"),
            uploading: false,
          },
        ];
      });
      const editor = editorRef.current;
      if (editor) {
        const handle = kol?.handle;
        insertChip(editor, url, url, handle ? `@${handle}` : "Style", handle ? "STYLED" : undefined, true);
        setPrompt(serializeEditor(editor));
        editor.focus();
      }
    };

    apply(pick.url);
    if (pick.source === "new" && kol) {
      pendingStyles.current = pendingStyles.current.filter((item) => item.imageUrl !== pick.url);
      pendingStyles.current.push({
        kolId: kol.id,
        handle: kol.handle,
        style: pick.style,
        imageUrl: pick.url,
      });
    }
    setStyleKol(null);
  };

  const toggleKol = (handle: string) => {
    const editor = editorRef.current;
    const token = `@${handle}`;
    const kol = findKol(handle);
    if (selectedKolsRef.current.includes(handle)) {
      setSelectedKols((prev) => prev.filter((h) => h !== handle));
      if (editor) removeChip(editor, token);
    } else {
      setSelectedKols((prev) => (prev.includes(handle) ? prev : [...prev, handle]));
      if (editor) insertChip(editor, token, kol?.avatar ?? null, undefined, undefined, true);
    }
    if (editor) setPrompt(serializeEditor(editor));
  };

  const applyMention = (token: string, image: string | null, kolHandle?: string) => {
    const editor = editorRef.current;
    const anchor = mentionAnchor.current;
    if (editor && anchor?.node.isConnected && anchor.node.textContent?.slice(anchor.at, anchor.at + 1) === "@") {
      const text = anchor.node.textContent ?? "";
      const end = Math.min(text.length, anchor.at + 1 + anchor.len);
      anchor.node.textContent = text.slice(0, anchor.at) + text.slice(end);
      const range = document.createRange();
      range.setStart(anchor.node, anchor.at);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    if (kolHandle && !selectedKolsRef.current.includes(kolHandle)) {
      setSelectedKols((prev) => (prev.includes(kolHandle) ? prev : [...prev, kolHandle]));
    }
    if (editor) {
      insertChip(editor, token, image);
      setPrompt(serializeEditor(editor));
      editor.focus();
    }
    setMentionQuery(null);
    mentionAnchor.current = null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) continue;

        const label = nextLabel(isVideo ? "video" : "image");
        const localUrl = URL.createObjectURL(file);
        const thumbUrl = isVideo ? await frameFromFile(file) : localUrl;
        const item: OmniMedia = {
          id: crypto.randomUUID(),
          type: isVideo ? "video" : "image",
          localUrl,
          thumbUrl,
          uploadedUrl: null,
          label,
          uploading: true,
        };
        setMedia((prev) => [...prev, item]);
        if (editorRef.current) insertChip(editorRef.current, `@${label}`, thumbUrl, undefined, undefined, true);

        const form = new FormData();
        form.append("file", file);
        try {
          const res = await apiFetch("/api/refs", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Upload failed");
          setMedia((prev) =>
            prev.map((m) =>
              m.id === item.id ? { ...m, uploadedUrl: data.url, uploading: false } : m,
            ),
          );
        } catch {
          toast(`Couldn't upload ${file.name}`, "error");
          setMedia((prev) => prev.filter((m) => m.id !== item.id));
          if (editorRef.current) removeChip(editorRef.current, `@${item.label}`);
          URL.revokeObjectURL(item.localUrl);
        }
      }

      if (editorRef.current) setPrompt(serializeEditor(editorRef.current));
      setTimeout(() => editorRef.current?.focus(), 50);
    },
    [toast],
  );

  const removeMedia = (id: string) => {
    const item = mediaRef.current.find((m) => m.id === id);
    if (item) {
      if (item.localUrl.startsWith("blob:")) URL.revokeObjectURL(item.localUrl);
      if (editorRef.current) {
        removeChip(editorRef.current, `@${item.label}`);
        if (item.uploadedUrl) removeChip(editorRef.current, item.uploadedUrl);
      }
      pendingStyles.current = pendingStyles.current.filter((style) => style.imageUrl !== item.uploadedUrl && style.imageUrl !== item.localUrl);
    }
    setMedia((prev) => prev.filter((m) => m.id !== id));
    if (editorRef.current) setPrompt(serializeEditor(editorRef.current));
  };

  const handleSubmit = async () => {
    if (!session) { toast("Connect your wallet to generate.", "error"); return; }
    const trimmed = prompt.trim();
    if (!trimmed) { toast("Write a prompt first.", "error"); return; }
    if (!title.trim()) { toast("Name the video first.", "error"); return; }
    if (media.some((m) => m.uploading)) { toast("Wait for uploads to finish.", "error"); return; }

    setSubmitting(true);
    try {
      const omniAssets = media
        .filter((m) => m.uploadedUrl)
        .map((m) => ({ type: m.type, url: m.uploadedUrl!, name: m.label }));

      const res = await apiFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: trimmed,
          title: title.trim(),
          omniAssets,
          referenceVideoUrl: remix?.url ?? null,
          visibility: "public",
          settings: {
            model: "wan3.0-video",
            aspectRatio: remix?.aspectRatio ?? settings.ratio,
            duration: settings.duration,
            quality: "standard",
            negativePrompt: "",
            seed: null,
            cameraMovement: "static",
            promptAdherence: 70,
            creativity: 50,
            publicPrompt: true,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast(data.error ?? "Generation failed.", "error"); return; }

      const used = prompt.trim();
      const toSave = pendingStyles.current.filter((item) => used.includes(item.imageUrl));
      pendingStyles.current = pendingStyles.current.filter((item) => !used.includes(item.imageUrl));
      for (const item of toSave) {
        void apiFetch("/api/styles/select", {
          method: "POST",
          body: JSON.stringify(item),
        }).catch(() => undefined);
      }

      toast("Generating… this takes 4–5 minutes.", "success");
      router.push("/creations");
      if (editorRef.current) editorRef.current.replaceChildren();
      setPrompt("");
      setTitle("");
      setMedia([]);
      setRemix(null);
      setSelectedKols([]);
      imgSeq = 0;
      vidSeq = 0;
      remixReserved = false;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't start generation.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const durationLocked = remix !== null;
  const mentionQ = (mentionQuery ?? "").trim().toLowerCase();
  const mentionAssets = [
    ...(remix
      ? [{
          id: `remix-${remix.id}`,
          token: `@${remix.label}`,
          title: remix.title || remix.label,
          image: mediaUrl(remix.thumbnailUrl),
        }]
      : []),
    ...media.map((item) => ({
      id: item.id,
      token: `@${item.label}`,
      title: item.label,
      image: item.thumbUrl,
    })),
  ].filter((item) =>
    !mentionQ || item.title.toLowerCase().includes(mentionQ) || item.token.toLowerCase().includes(mentionQ),
  );
  const mentionKols = KOLS.filter((kol) =>
    !mentionQ ||
    kol.name.toLowerCase().includes(mentionQ) ||
    kol.handle.toLowerCase().includes(mentionQ),
  );

  return (
    <>
    <motion.div
      ref={containerRef}
      style={{ x: "-50%", y: chatY }}
      className="fixed bottom-[calc(56px+0.35rem)] md:bottom-2 left-1/2 z-30 w-[calc(100%-0.5rem)] max-w-3xl"
    >
      {mentionQuery !== null && (
        <div
          ref={mentionRef}
          className="absolute bottom-full left-0 right-0 z-40 mb-2 overflow-hidden rounded-2xl border border-white/10 bg-[#121212]/95 shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="border-b border-white/8 px-3 py-2">
            <input
              value={mentionQuery}
              onChange={(e) => setMentionQuery(e.target.value)}
              placeholder="Search assets or KOLs"
              className="w-full bg-transparent text-[14px] text-white placeholder:text-white/35 focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">Assets</p>
            {mentionAssets.length === 0 && (
              <p className="px-3 py-1.5 text-[13px] text-white/40">Nothing loaded matches</p>
            )}
            {mentionAssets.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMention(item.token, item.image)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/6"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-7 w-7 rounded-md object-cover" />
                ) : (
                  <span className="h-7 w-7 rounded-md bg-white/10" />
                )}
                <span className="truncate text-[13px] text-white">{item.token}</span>
              </button>
            ))}
            <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-white/35">KOLs</p>
            {mentionKols.length === 0 && (
              <p className="px-3 py-1.5 text-[13px] text-white/40">No KOLs match</p>
            )}
            {mentionKols.map((kol) => (
              <button
                key={kol.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMention(`@${kol.handle}`, kol.avatar, kol.handle)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kol.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                <span className="truncate text-[13px] text-white">{kol.name}</span>
                <span className="ml-auto truncate text-[12px] text-white/40">@{kol.handle}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ChatAura />
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-yellow/20" />

      <div className="omni-box relative rounded-2xl bg-ink/92 backdrop-blur-xl overflow-hidden shadow-2xl">

        {/* Settings panel */}
        {showSettings && (
          <div className="border-b border-white/6 px-4 py-3 space-y-3 animate-rise">
            <div className="flex gap-1.5 flex-wrap">
              {RATIOS.map((r) => (
                <button
                  key={r}
                  disabled={durationLocked}
                  onClick={() => setSettings((s) => ({ ...s, ratio: r }))}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors",
                    settings.ratio === r
                      ? "bg-yellow text-ink"
                      : "border border-white/10 text-white/70 hover:text-white",
                    durationLocked && "cursor-not-allowed opacity-60",
                  )}
                >{r}</button>
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-[12px] text-white/50">
                Duration — {settings.duration}s
                {durationLocked && <span className="ml-2 text-yellow/70">locked to remix</span>}
              </p>
              <input
                type="range" min={2} max={30} step={1} value={settings.duration}
                disabled={durationLocked}
                onChange={(e) => setSettings((s) => ({ ...s, duration: Number(e.target.value) }))}
                className={cn("w-full accent-yellow focus:outline-none", durationLocked && "opacity-40 cursor-not-allowed")}
              />
            </div>
          </div>
        )}

        <div className="flex items-stretch gap-1.5 px-1.5 pt-1.5">
          <div className="flex min-w-0 flex-1 items-center rounded-xl bg-white/[0.06] px-2.5 py-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 80))}
              placeholder="Video name"
              disabled={!session || submitting}
              className="w-full bg-transparent text-[16px] font-semibold text-white outline-none placeholder:text-white/55 disabled:opacity-40"
            />
          </div>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-xl border px-3 text-[12px] font-medium transition-colors",
              showSettings ? "border-yellow/40 text-yellow" : "border-white/15 text-white/70 hover:text-white",
            )}
          >
            {settings.ratio} <span className="text-white/30">|</span> {settings.duration}s
            <Settings2 className="h-3 w-3" />
          </button>
        </div>

        <div className="mx-1.5 mt-1.5 mb-1.5 flex items-stretch gap-1.5">
        {/* Prompt — chips render inline; the stored prompt is still @Handle / @Image1 */}
        <motion.div
          layout
          className="relative min-w-0 flex-1 rounded-xl bg-white/[0.06] px-2.5 py-1.5"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          {!prompt && (
            <p className="pointer-events-none absolute left-2.5 top-1.5 text-[14px] text-white/50">
              {session ? "Describe what you want to generate… (⌘↵ to send)" : "Connect your wallet to start creating"}
            </p>
          )}
          <div
            ref={editorRef}
            contentEditable={!!session && !submitting}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            onInput={() => {
              syncEditor();
              refreshMention();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setMentionQuery(null);
                return;
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className={cn(
              "min-h-[52px] w-full whitespace-pre-wrap break-words text-[14px] leading-6 text-white focus:outline-none",
              (!session || submitting) && "opacity-40",
            )}
          />
        </motion.div>
        <AnimatePresence initial={false}>
          {remix && (
            <motion.aside
              key="remix-card"
              initial={{ width: 0, opacity: 0, x: 28 }}
              animate={{ width: 148, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 28 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="flex h-full w-[148px] flex-col gap-2 rounded-xl border border-yellow/25 bg-yellow/10 p-2">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow/80">Remixing</p>
                  <button
                    onClick={clearRemix}
                    className="rounded-full p-0.5 text-white/50 hover:text-white"
                    aria-label="Clear remix"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="relative h-14 overflow-hidden rounded-lg bg-ink">
                  {mediaUrl(remix.thumbnailUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(remix.thumbnailUrl) ?? undefined} alt="" className="h-full w-full object-cover" />
                  ) : mediaUrl(remix.url) ? (
                    <video src={mediaUrl(remix.url) ?? undefined} className="h-full w-full object-cover" muted playsInline />
                  ) : null}
                </div>
                <p className="truncate text-[12px] font-medium leading-tight text-white">{remix.title}</p>
                <p className="text-[10px] text-white/45">{remix.duration}s · locked</p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        </div>

        {/* Bottom bar — thumbnails + controls */}
        <div className="flex items-center gap-1.5 border-t border-white/5 px-1.5 py-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
            {/* Selected KOL chips — avatar + handle */}
            {selectedKols.map((handle) => {
              const kol = findKol(handle);
              if (!kol) return null;
              return (
                <div key={handle} className="group/thumb relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={kol.avatar} alt={kol.name} className="h-full w-full object-cover" />
                  <button
                    onClick={() => toggleKol(handle)}
                    className="absolute inset-0 flex items-center justify-center bg-ink/70 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    aria-label={`Remove ${kol.name}`}
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              );
            })}
            {/* Media thumbnails */}
            {media.map((item) => (
              <div key={item.id} className="group/thumb relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                {item.type === "video" && !item.thumbUrl ? (
                  <video src={item.localUrl} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbUrl || item.localUrl} alt={item.label} className="h-full w-full object-cover" />
                )}
                {item.uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-yellow border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="absolute inset-0 flex items-center justify-center bg-ink/70 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    aria-label={`Remove ${item.label}`}
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>
            ))}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
            />
            {/* Media button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!session || submitting}
              className="flex h-8 items-center gap-1 flex-shrink-0 rounded-lg border border-dashed border-white/20 px-2 text-[12px] font-medium text-white/50 hover:border-white/40 hover:text-white transition-colors disabled:opacity-40"
            >
              <Plus className="h-3 w-3" /> Media
            </button>
            {/* KOLs button */}
            <button
              ref={kolButtonRef}
              onClick={() => setShowKols((open) => !open)}
              disabled={!session || submitting}
              className={cn(
                "flex h-8 items-center gap-1 flex-shrink-0 rounded-lg border px-2 text-[12px] font-medium transition-colors disabled:opacity-40",
                selectedKols.length > 0
                  ? "border-yellow/40 bg-yellow/10 text-yellow"
                  : "border-dashed border-white/20 text-white/50 hover:border-white/40 hover:text-white",
              )}
            >
              <Users className="h-3 w-3" /> KOLs
              {selectedKols.length > 0 && (
                <span className="ml-0.5 rounded-full bg-yellow px-1 text-[10px] font-bold text-ink">
                  {selectedKols.length}
                </span>
              )}
            </button>
          </div>

          <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-[14px] font-semibold text-white/40 hover:text-white transition-colors">
            @
          </button>

          <button
            onClick={handleSubmit}
            disabled={!session || submitting || !prompt.trim() || !title.trim()}
            className={cn(
              "flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-all",
              session && prompt.trim() && title.trim() && !submitting
                ? "bg-yellow text-ink hover:bg-yellow-bright shadow-[0_0_12px_rgba(255,241,118,0.25)]"
                : "bg-elevated text-white/30 cursor-not-allowed",
            )}
          >
            {submitting
              ? <span className="h-3 w-3 rounded-full border-2 border-ink/40 border-t-ink animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />}
            {remaining > 0 ? remaining : ""}
          </button>
        </div>
      </div>
    </motion.div>

    <KolPicker
      anchorRef={containerRef}
      open={showKols}
      selected={selectedKols}
      onToggle={toggleKol}
      onStyle={(kol, mode) => {
        setStyleSession((n) => n + 1);
        setStyleMode(mode);
        setStyleKol(kol);
      }}
      onClose={() => setShowKols(false)}
    />
    <StylePicker
      kol={styleKol}
      mode={styleMode}
      session={styleSession}
      onClose={() => setStyleKol(null)}
      onPick={useStyleImage}
    />
  </>
  );
}
