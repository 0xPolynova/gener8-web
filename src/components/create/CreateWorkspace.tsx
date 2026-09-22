"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PromptEditor } from "./PromptEditor";
import { GenerationSettingsPanel } from "./GenerationSettings";
import { PreviewStage } from "./PreviewStage";
import { CreateModeToggle, type CreateMode } from "./CreateModeToggle";
import { PresetsPanel } from "./PresetsPanel";
import { CustomReferencePanel } from "./CustomReferencePanel";
import { CREATE_PRESETS, type CreatePreset } from "@/lib/data/presets";
import { composeCustomSwapPrompt } from "@/lib/data/custom-swap-prompt";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/components/providers/AppState";
import { useGeneration } from "@/components/providers/GenerationState";
import {
  MIN_PROMPT_LENGTH,
  MAX_TITLE_LENGTH,
  DEFAULT_CUSTOM_MODEL,
  PRESET_MODEL_ID,
} from "@/lib/config/models";
import { formatTokenBalance } from "@/lib/format";
import { publicErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  GenerationSettings,
  VideoWithCreator,
  Visibility,
} from "@/types";

const DEFAULT_SETTINGS: GenerationSettings = {
  model: DEFAULT_CUSTOM_MODEL,
  aspectRatio: "16:9",
  duration: 5,
  quality: "standard",
  negativePrompt: "",
  seed: null,
  cameraMovement: "static",
  promptAdherence: 70,
  creativity: 50,
  publicPrompt: true,
};

export function CreateWorkspace() {
  const search = useSearchParams();
  const remixId = search.get("remix");
  const { toast } = useToast();
  const { session, eligibility, refresh } = useAppState();
  const generation = useGeneration();

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<CreateMode>("custom");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<(File | null)[]>([]);
  const [baseVideo, setBaseVideo] = useState<File | null>(null);
  const [firstFrame, setFirstFrame] = useState<File | null>(null);
  const [lastFrame, setLastFrame] = useState<File | null>(null);
  const [styleRefs, setStyleRefs] = useState<File[]>([]);
  const promptRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  const { status, video, startedAt, generating, draft } = generation;
  const previewForMode = !draft || draft.mode === mode;
  const stageStatus = previewForMode ? status : "idle";
  const stageVideo = previewForMode ? video : null;

  useEffect(() => {
    if (restored.current || !generation.draft || generation.status === "idle") {
      return;
    }
    restored.current = true;
    const draft = generation.draft;
    setMode(draft.mode);
    setSelectedPresetId(draft.selectedPresetId);
    setSettings(draft.settings);
    if (draft.mode === "custom") setPrompt(draft.prompt);
    setTitle(draft.title);
    setVisibility(draft.visibility);
  }, [generation.draft, generation.status]);

  useEffect(() => {
    if (!remixId) return;
    apiFetch(`/api/videos/${remixId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.video) return;
        const v = data.video as VideoWithCreator;
        const text = v.publicPrompt
          ? v.prompt
          : v.userId === session?.userId
            ? v.prompt
            : "";
        if (!text && !v.publicPrompt) {
          toast("The creator hid this prompt. Remix with a new idea.");
        }
        setPrompt(text);
        setMode("custom");
        setSettings((s) => ({
          ...s,
          model: v.model,
          aspectRatio: v.aspectRatio,
          duration: v.duration,
          quality: v.quality,
          negativePrompt: v.negativePrompt ?? "",
          seed: v.seed ?? null,
          cameraMovement: v.cameraMovement ?? "static",
          promptAdherence: v.promptAdherence ?? 70,
          creativity: v.creativity ?? 50,
          publicPrompt: true,
        }));
      })
      .catch(() => toast("Couldn’t load remix settings.", "error"));
  }, [remixId, session?.userId, toast]);

  const applyPreset = (preset: CreatePreset) => {
    setPrompt(preset.prompt);
    setTitle(preset.title);
    setSettings((s) => ({
      ...s,
      model: preset.model,
      aspectRatio: preset.aspectRatio,
      duration: preset.duration,
      cameraMovement: preset.cameraMovement,
      quality: "standard",
    }));
    setMode("custom");
  };

  const required = eligibility?.required ?? 10_000;
  const state = eligibility?.state ?? "disconnected";

  const generate = useCallback(async () => {
    const preset = CREATE_PRESETS.find((p) => p.id === selectedPresetId);
    const presetSwap = mode === "presets" && preset?.composer === "character-swap";
    const customSwap = mode === "custom" && Boolean(baseVideo);
    const text = preset?.lockedPrompt
      ? preset.prompt
      : customSwap
        ? composeCustomSwapPrompt(prompt, styleRefs.length)
        : prompt;
    if (text.trim().length < MIN_PROMPT_LENGTH) {
      toast(publicErrorMessage("INVALID_PROMPT"), "error");
      return;
    }
    if (!session) {
      toast(publicErrorMessage("WALLET_DISCONNECTED"));
      return;
    }
    if (
      presetSwap &&
      referenceImages.filter(Boolean).length < (preset?.imageSlots ?? 0)
    ) {
      toast(
        `Add all ${preset?.imageSlots} photos to generate.`,
      );
      return;
    }
    if (customSwap && styleRefs.length < 1) {
      toast("Add a photo of the person to swap in.");
      return;
    }

    const swapSettings = customSwap
      ? { ...settings, duration: 15 as GenerationSettings["duration"] }
      : settings;

    const draft = {
      mode,
      selectedPresetId,
      settings: swapSettings,
      prompt: text,
      title,
      visibility,
    };
    generation.markBusy(draft);
    try {
      const imageFiles = presetSwap
        ? referenceImages.filter((file): file is File => Boolean(file))
        : styleRefs;
      const images = (
        await Promise.all(imageFiles.map((file) => fileToDataUrl(file)))
      ).filter((item): item is string => Boolean(item));
      const firstFrameImage =
        !presetSwap && !customSwap && firstFrame
          ? await fileToDataUrl(firstFrame)
          : null;
      const lastFrameImage =
        !presetSwap && !customSwap && lastFrame
          ? await fileToDataUrl(lastFrame)
          : null;
      const referenceVideoUrl = presetSwap
        ? preset?.baseVideoUrl ?? null
        : customSwap && baseVideo
          ? await uploadReferenceVideo(baseVideo)
          : null;

      const res = await apiFetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          settings: swapSettings,
          title: title.trim(),
          visibility,
          referenceVideoUrl,
          referenceImages: images,
          firstFrameImage,
          lastFrameImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        generation.fail(draft);
        toast(data.error ?? publicErrorMessage("INTERNAL"), "error");
        return;
      }
      generation.start({
        job: data.job,
        video: data.video,
        status: data.job.status,
        draft,
      });
      await refresh();
    } catch (error) {
      generation.fail(draft);
      toast(
        error instanceof Error ? error.message : publicErrorMessage("INTERNAL"),
        "error",
      );
    }
  }, [
    prompt,
    settings,
    title,
    visibility,
    session,
    toast,
    refresh,
    selectedPresetId,
    referenceImages,
    firstFrame,
    lastFrame,
    styleRefs,
    baseVideo,
    mode,
    generation,
  ]);

  const onToggleVisibility = async () => {
    if (!video) return;
    const next = video.visibility === "public" ? "private" : "public";
    const res = await apiFetch(`/api/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Couldn’t update visibility.", "error");
      return;
    }
    generation.patch({ video: data.video });
    toast(next === "public" ? "Published to Discover" : "Unpublished", "success");
  };

  const finishWorkspace = () => {
    generation.finish();
    restored.current = false;
    setPrompt("");
    setTitle("");
    setVisibility("private");
    setSettings(DEFAULT_SETTINGS);
    setSelectedPresetId(null);
    setReferenceImages([]);
    setBaseVideo(null);
    setFirstFrame(null);
    setLastFrame(null);
    setStyleRefs([]);
  };

  const lockCopy = useMemo(() => {
    if (state === "disconnected" || state === "unauthenticated") {
      return {
        title: "Connect a wallet",
        body: "Connect your Solana wallet to generate. Holding GENER8 unlocks creation.",
      };
    }
    if (state === "insufficient") {
      return {
        title: "More GENER8 required",
        body: `Hold at least ${formatTokenBalance(required)} GENER8 to unlock video generation.`,
      };
    }
    if (state === "limit_reached") {
      return {
        title: "Daily limit reached",
        body: "You’ve used today’s generations. Limits reset at midnight UTC.",
      };
    }
    return null;
  }, [state, required]);

  const canGenerate = state === "eligible" && !generating;

  const getTokenUrl = process.env.NEXT_PUBLIC_GET_GENER8_URL;

  return (
    <div>
      <div className="mb-5">
        <CreateModeToggle
          value={mode}
          disabled={generating}
          onChange={(next) => {
            if (generating) return;
            setMode(next);
            if (next === "custom") {
              setSettings((s) =>
                s.model === PRESET_MODEL_ID
                  ? { ...s, model: DEFAULT_CUSTOM_MODEL }
                  : s,
              );
            }
          }}
        />
      </div>

      {mode === "presets" ? (
        <>
        <PresetsPanel
          selectedId={selectedPresetId}
          images={referenceImages}
          onSelect={(preset) => {
            if (generating) return;
            if (preset.id !== selectedPresetId) {
              setReferenceImages(
                Array.from({ length: preset.imageSlots }, () => null),
              );
            }
            setSelectedPresetId(preset.id);
            setTitle(preset.title);
            setSettings((s) => ({
              ...s,
              model: preset.model,
              aspectRatio: preset.aspectRatio,
              duration: preset.duration,
              cameraMovement: preset.cameraMovement,
              quality: "standard",
            }));
          }}
          onImagesChange={setReferenceImages}
          onUsePreset={applyPreset}
          onBack={() => {
            if (generating) return;
            setSelectedPresetId(null);
            setReferenceImages([]);
          }}
          onGenerate={() => void generate()}
          canGenerate={canGenerate}
          generateHint={
            state !== "eligible"
              ? lockCopy?.body ?? "Connect a wallet that holds GENER8 to generate."
              : null
          }
          generating={generating}
          onCancel={() => generation.cancel()}
          status={stageStatus}
          video={stageVideo}
          startedAt={startedAt}
          onPublish={() => void onToggleVisibility()}
          onRegenerate={() => void generate()}
          onFinish={finishWorkspace}
        />
        {selectedPresetId &&
          CREATE_PRESETS.find((p) => p.id === selectedPresetId)?.composer !==
            "character-swap" &&
          (stageStatus !== "idle" || stageVideo) && (
          <div className="mt-8">
            <PreviewStage
              aspectRatio={settings.aspectRatio}
              status={stageStatus}
              video={stageVideo}
              startedAt={startedAt}
              onPublish={() => void onToggleVisibility()}
              onRegenerate={() => void generate()}
              onEdit={() => setMode("custom")}
              onFinish={finishWorkspace}
            />
          </div>
        )}
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,400px)_1fr] lg:items-start">
      <div ref={promptRef} className="space-y-6 lg:sticky lg:top-[72px]">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Create</h1>
          <p className="mt-1 text-sm text-muted">Turn an idea into video.</p>
        </div>

        <PromptEditor
          value={prompt}
          onChange={setPrompt}
          disabled={generating}
          placeholder={
            baseVideo
              ? "Optional — keep the motion from the clip, replace the person with the photo…"
              : "Describe the video you want to create..."
          }
          hint={
            baseVideo
              ? "We’ll lock the clip as @Video1 and the first photo as @Image1."
              : undefined
          }
          showInspirations={!baseVideo}
        />

        <CustomReferencePanel
          baseVideo={baseVideo}
          firstFrame={firstFrame}
          lastFrame={lastFrame}
          styleRefs={styleRefs}
          onBaseVideo={setBaseVideo}
          onFirstFrame={setFirstFrame}
          onLastFrame={setLastFrame}
          onStyleRefs={setStyleRefs}
          disabled={generating}
        />

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-paper">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => {
              if (e.target.value.length <= MAX_TITLE_LENGTH) setTitle(e.target.value);
            }}
            placeholder="Optional — otherwise we name it from the prompt"
            maxLength={MAX_TITLE_LENGTH}
            disabled={generating}
            className="h-11 w-full rounded-[10px] border border-line bg-elevated px-3.5 text-sm text-paper placeholder:text-[#5a5a5a] focus:border-line focus:outline-none focus-visible:outline-none disabled:opacity-50"
          />
        </label>

        <GenerationSettingsPanel
          settings={settings}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          tier={eligibility?.tier ?? null}
          disabled={generating}
          referenceVideo={Boolean(baseVideo)}
        />

        <div className="rounded-[12px] border border-line bg-elevated p-3">
          <div className="mb-3 flex items-center justify-between text-[12px] text-muted">
            <span>
              Requires {formatTokenBalance(required)} GENER8
            </span>
            {eligibility?.remainingToday != null && (
              <span>
                {eligibility.remainingToday} left today
              </span>
            )}
          </div>
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-[10px] border border-line bg-surface p-1">
            {(
              [
                { id: "private" as const, label: "Private" },
                { id: "public" as const, label: "Public" },
              ]
            ).map((opt) => {
              const active = visibility === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibility(opt.id)}
                  disabled={generating}
                  className={cn(
                    "h-8 rounded-[7px] text-[12px] font-medium transition-colors",
                    active ? "bg-elevated text-yellow" : "text-muted hover:text-paper",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mb-3 text-[11px] text-muted">
            {visibility === "private"
              ? "Stays in My Creations until you publish."
              : "Goes on Discover when generation finishes."}
          </p>
          <Button
            size="lg"
            className="w-full"
            disabled={!canGenerate}
            onClick={() => void generate()}
          >
            {generating ? "Generating…" : "Generate Video"}
          </Button>
        </div>
      </div>

      <div className="relative h-full min-h-[480px] lg:sticky lg:top-[72px]">
        <PreviewStage
          aspectRatio={settings.aspectRatio}
          status={stageStatus}
          video={stageVideo}
          startedAt={startedAt}
          onPublish={() => void onToggleVisibility()}
          onRegenerate={() => void generate()}
          onEdit={() => promptRef.current?.scrollIntoView({ behavior: "smooth" })}
          onFinish={finishWorkspace}
        />
        {lockCopy && stageStatus === "idle" && (
          <div className="absolute inset-4 flex items-end justify-center md:inset-6">
            <div className="mb-4 w-full max-w-sm rounded-[12px] border border-line bg-ink/90 p-4 text-center backdrop-blur-sm">
              <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full border border-[#3a3200] bg-[#161200] text-yellow">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold">{lockCopy.title}</h3>
              <p className="mt-1 text-xs text-muted">{lockCopy.body}</p>
              {state === "insufficient" && (
                <div className="mt-3 flex justify-center gap-2">
                  <Link href="/gener8">
                    <Button size="sm" variant="outline">
                      See $GENER8 tiers
                    </Button>
                  </Link>
                  {getTokenUrl ? (
                    <a href={getTokenUrl} target="_blank" rel="noreferrer">
                      <Button size="sm">Get GENER8</Button>
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Couldn’t read photo"));
    reader.readAsDataURL(file);
  });
}

async function uploadReferenceVideo(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await apiFetch("/api/refs", { method: "POST", body });
  const data = await res.json();
  if (!res.ok || typeof data.url !== "string") {
    throw new Error(data.error ?? "Couldn’t upload the base video.");
  }
  return data.url as string;
}
