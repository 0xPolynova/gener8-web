"use client";

import { cn } from "@/lib/utils";

export type CreateMode = "presets" | "custom";

export function CreateModeToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: CreateMode;
  onChange: (value: CreateMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[240px] grid-cols-2 gap-0.5 rounded-[10px] border border-line bg-surface p-0.5">
      {(
        [
          { id: "custom" as const, label: "Custom" },
          { id: "presets" as const, label: "Presets" },
        ]
      ).map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "h-8 rounded-[7px] text-[12px] font-medium transition-colors",
              active
                ? "bg-yellow text-ink"
                : "text-muted hover:text-paper",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
