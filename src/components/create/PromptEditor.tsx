"use client";

import { useEffect, useState } from "react";
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH, PROMPT_INSPIRATIONS } from "@/lib/config/models";
import { cn } from "@/lib/utils";

export function PromptEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Describe the video you want to create...",
  hint,
  showInspirations = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  showInspirations?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-medium text-paper">
        Prompt
      </label>
      <div className="relative rounded-[12px] border border-line bg-elevated">
        <textarea
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_PROMPT_LENGTH) onChange(e.target.value);
          }}
          placeholder={placeholder}
          rows={7}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-3.5 py-3 text-[14px] leading-relaxed text-paper placeholder:text-[#5a5a5a] focus:outline-none focus-visible:outline-none"
        />
        <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[11px] text-muted">
          <span>
            {hint ??
              (value.trim().length < MIN_PROMPT_LENGTH
                ? "A little more detail helps."
                : "The more specific, the better the cut.")}
          </span>
          <span
            className={cn(
              value.length > MAX_PROMPT_LENGTH - 80 && "text-yellow",
            )}
          >
            {value.length}/{MAX_PROMPT_LENGTH}
          </span>
        </div>
      </div>
      {showInspirations && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PROMPT_INSPIRATIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onChange(item.prompt)}
              disabled={disabled}
              className="h-7 rounded-full border border-line bg-surface px-2.5 text-[11px] text-muted transition-colors hover:border-[#333] hover:text-paper disabled:pointer-events-none disabled:opacity-40"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function useRemixPrompt(initial?: string) {
  const [prompt, setPrompt] = useState(initial ?? "");
  useEffect(() => {
    if (initial) setPrompt(initial);
  }, [initial]);
  return [prompt, setPrompt] as const;
}
