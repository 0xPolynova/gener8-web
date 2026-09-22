import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-yellow text-ink hover:bg-yellow-bright active:translate-y-px yellow-glow-sm font-semibold",
  ghost:
    "bg-transparent text-paper hover:bg-elevated active:translate-y-px",
  outline:
    "bg-transparent text-paper border border-line hover:border-[#3a3a3a] hover:bg-elevated active:translate-y-px",
  danger:
    "bg-transparent text-danger border border-[#3a1515] hover:bg-[#1a0a0a] active:translate-y-px",
  subtle:
    "bg-elevated text-paper hover:bg-[#1c1c1c] active:translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-[7px] gap-1.5",
  md: "h-10 px-4 text-sm rounded-[8px] gap-2",
  lg: "h-12 px-5 text-[15px] rounded-[10px] gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
