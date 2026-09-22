"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ASPECT_RATIOS,
  CAMERA_MOVEMENTS,
  DURATIONS,
  QUALITIES,
  CUSTOM_VIDEO_MODELS,
} from "@/lib/config/models";
import { cn } from "@/lib/utils";
import type { GenerationSettings, TokenTier } from "@/types";

export function GenerationSettingsPanel({
  settings,
  onChange,
  tier,
  disabled = false,
  referenceVideo = false,
}: {
  settings: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
  tier: TokenTier | null;
  disabled?: boolean;
  referenceVideo?: boolean;
}) {
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className={cn("space-y-5", disabled && "pointer-events-none opacity-50")}>
      {referenceVideo ? (
        <p className="rounded-[10px] border border-line bg-elevated px-3 py-2 text-[12px] text-muted">
          Base clip uses Wan 3.0. First 15 seconds only · 15s output.
        </p>
      ) : (
        <Field label="Model">
          <ModelSelect
            value={settings.model}
            onChange={(model) => onChange({ model })}
            tier={tier}
          />
        </Field>
      )}

      <Field label="Aspect ratio">
        <Segmented
          options={ASPECT_RATIOS.map((a) => ({
            id: a.id,
            label: a.label,
            hint: a.hint,
          }))}
          value={settings.aspectRatio}
          onChange={(aspectRatio) => onChange({ aspectRatio })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration">
          {referenceVideo ? (
            <div className="grid h-10 place-items-center rounded-[10px] border border-line bg-elevated text-[13px] font-medium text-paper">
              15s
            </div>
          ) : (
            <Segmented
              options={DURATIONS.map((d) => ({ id: String(d.id), label: d.label }))}
              value={String(settings.duration)}
              onChange={(v) =>
                onChange({ duration: Number(v) as GenerationSettings["duration"] })
              }
            />
          )}
        </Field>
        <Field label="Quality">
          <Segmented
            options={QUALITIES.map((q) => ({ id: q.id, label: q.label }))}
            value={settings.quality}
            onChange={(quality) =>
              onChange({ quality: quality as GenerationSettings["quality"] })
            }
          />
        </Field>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="flex w-full items-center justify-between text-[13px] font-medium text-muted hover:text-paper"
        >
          Advanced settings
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              advanced && "rotate-180",
            )}
          />
        </button>
        {advanced && (
          <div className="mt-3 space-y-4 rounded-[12px] border border-line bg-elevated p-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-muted">
                Negative prompt
              </span>
              <input
                value={settings.negativePrompt}
                onChange={(e) => onChange({ negativePrompt: e.target.value })}
                placeholder="blur, watermark, extra limbs..."
                className="h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-sm text-paper placeholder:text-[#555] focus:border-line focus:outline-none focus-visible:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-muted">
                Seed
              </span>
              <input
                type="number"
                value={settings.seed ?? ""}
                onChange={(e) =>
                  onChange({
                    seed: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Random"
                className="h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-sm text-paper placeholder:text-[#555] focus:border-line focus:outline-none focus-visible:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-muted">
                Camera movement
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CAMERA_MOVEMENTS.map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => onChange({ cameraMovement: cam.id })}
                    className={cn(
                      "h-7 rounded-full border px-2.5 text-[11px]",
                      settings.cameraMovement === cam.id
                        ? "border-[#3a3200] bg-[#161200] text-yellow"
                        : "border-line text-muted hover:text-paper",
                    )}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </label>
            <Slider
              label="Prompt adherence"
              value={settings.promptAdherence}
              onChange={(promptAdherence) => onChange({ promptAdherence })}
            />
            <Slider
              label="Creativity"
              value={settings.creativity}
              onChange={(creativity) => onChange({ creativity })}
            />
            <label className="flex items-center justify-between gap-3 text-sm text-paper">
              <span>Show full prompt publicly</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.publicPrompt}
                onClick={() => onChange({ publicPrompt: !settings.publicPrompt })}
                className={cn(
                  "relative h-6 w-10 rounded-full transition-colors",
                  settings.publicPrompt ? "bg-yellow" : "bg-[#2a2a2a]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform",
                    settings.publicPrompt ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelSelect({
  value,
  onChange,
  tier,
}: {
  value: string;
  onChange: (id: string) => void;
  tier: TokenTier | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    CUSTOM_VIDEO_MODELS.find((model) => model.id === value) ??
    CUSTOM_VIDEO_MODELS[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-[10px] border border-line bg-elevated px-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-paper">
            {selected?.name ?? "Select a model"}
          </span>
          {selected?.description && (
            <span className="block truncate text-[11px] text-muted">
              {selected.description}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-[10px] border border-line bg-surface p-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          {CUSTOM_VIDEO_MODELS.map((model) => {
            const locked = Boolean(tier) && !tier!.models.includes(model.id);
            const active = value === model.id;
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={active}
                disabled={locked}
                onClick={() => {
                  onChange(model.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start justify-between rounded-[8px] px-2.5 py-2 text-left transition-colors",
                  active ? "bg-elevated text-yellow" : "text-paper hover:bg-elevated",
                  locked && "opacity-40",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{model.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {model.description}
                  </span>
                </span>
                {locked && (
                  <span className="ml-2 shrink-0 text-[10px] uppercase tracking-wide text-muted">
                    Tier {model.minTier}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-medium text-paper">{label}</div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-[10px] border border-line bg-surface p-1">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
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
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted">
        {label}
        <span className="text-paper">{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-yellow"
      />
    </label>
  );
}
