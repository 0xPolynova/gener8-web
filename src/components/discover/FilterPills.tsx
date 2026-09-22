"use client";

import { cn } from "@/lib/utils";
import type { DiscoverFilter } from "@/types";

const FILTERS: { id: DiscoverFilter; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "latest", label: "Latest" },
  { id: "following", label: "Following" },
  { id: "cinematic", label: "Cinematic" },
  { id: "animation", label: "Animation" },
  { id: "memes", label: "Memes" },
  { id: "music", label: "Music" },
  { id: "experimental", label: "Experimental" },
];

export function FilterPills({
  value,
  onChange,
}: {
  value: DiscoverFilter;
  onChange: (value: DiscoverFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTERS.map((filter) => {
        const active = filter.id === value;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              "h-8 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              active
                ? "border-yellow bg-[#161200] text-yellow"
                : "border-line bg-surface text-muted hover:border-[#333] hover:text-paper",
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
