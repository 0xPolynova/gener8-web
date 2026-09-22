import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-surface p-1">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "h-8 rounded-[7px] px-3 text-[13px] font-medium transition-colors",
              active
                ? "bg-elevated text-yellow"
                : "text-muted hover:text-paper",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
