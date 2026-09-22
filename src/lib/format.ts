import { formatDistanceToNowStrict } from "date-fns";

export function formatCount(value: number): string {
  if (value < 1000) return value.toLocaleString();
  if (value < 10_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (value < 1_000_000)
    return `${Math.round(value / 1000).toLocaleString()}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

export function formatTokenBalance(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function abbreviateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function formatDuration(seconds: number): string {
  return `${seconds}s`;
}

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function promptPreview(prompt: string, max = 72): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

export function titleFromPrompt(prompt: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  const first = clean.split(/[.!?]/)[0] ?? clean;
  if (first.length <= 48) return first;
  return `${first.slice(0, 48).trim()}…`;
}

export function normalizeXHandle(raw: string) {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "")
    .split(/[/?#]/)[0]
    .trim();
}

export function xProfileUrl(handle: string) {
  return `https://x.com/${normalizeXHandle(handle)}`;
}
