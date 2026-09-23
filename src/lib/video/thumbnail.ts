import { mediaUrl } from "@/lib/api";

function streamUid(url: URL) {
  return url.pathname.split("/").filter(Boolean)[0] ?? "";
}

function isStreamHost(hostname: string) {
  return hostname.endsWith("cloudflarestream.com") || hostname.endsWith("videodelivery.net");
}

/** Ask Cloudflare for a large still instead of the default small poster. */
export function sharpStill(input: string | null) {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (!isStreamHost(url.hostname) || !url.pathname.includes("/thumbnails/")) return input;
    url.searchParams.set("time", url.searchParams.get("time") || "1s");
    url.searchParams.set("height", "1280");
    url.searchParams.set("fit", "crop");
    return url.toString();
  } catch {
    return input;
  }
}

/** Play the full MP4 so hover does not start on a low adaptive rendition. */
export function sharpPlayback(videoUrl: string | null) {
  const playable = mediaUrl(videoUrl);
  if (!playable) return null;
  try {
    const url = new URL(playable);
    if (!isStreamHost(url.hostname)) return playable;
    if (url.pathname.includes("/downloads/")) return playable;
    const uid = streamUid(url);
    if (!uid) return playable;
    return `${url.origin}/${uid}/downloads/default.mp4`;
  } catch {
    return playable;
  }
}

/** Prefer a stored still; for Cloudflare Stream, derive a large one from the playback URL. */
export function stillFromVideo(videoUrl: string | null, thumbnailUrl: string | null) {
  const stored = sharpStill(mediaUrl(thumbnailUrl));
  if (stored && stored.includes("/thumbnails/")) return stored;
  const playable = mediaUrl(videoUrl);
  if (!playable) return stored;
  try {
    const url = new URL(playable);
    if (!isStreamHost(url.hostname)) return stored;
    const uid = streamUid(url);
    if (!uid) return stored;
    return `${url.origin}/${uid}/thumbnails/thumbnail.jpg?time=1s&height=1280&fit=crop`;
  } catch {
    return stored;
  }
}

const stillCache = new Map<string, string>();

export function readCachedStill(videoUrl: string | null) {
  if (!videoUrl) return null;
  return stillCache.get(videoUrl) ?? null;
}

/** Grab the current decoded frame so later mounts don’t re-download the MP4 for a poster. */
export function captureVideoStill(el: HTMLVideoElement, videoUrl: string) {
  const cached = stillCache.get(videoUrl);
  if (cached) return cached;
  if (!el.videoWidth || !el.videoHeight) return null;
  try {
    const canvas = document.createElement("canvas");
    const max = 1280;
    const scale = Math.min(1, max / Math.max(el.videoWidth, el.videoHeight));
    canvas.width = Math.max(1, Math.round(el.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(el.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    const sample = ctx.getImageData(
      0,
      0,
      Math.min(canvas.width, 16),
      Math.min(canvas.height, 16),
    ).data;
    let lit = 0;
    for (let i = 0; i < sample.length; i += 4) {
      if (sample[i] + sample[i + 1] + sample[i + 2] > 24) lit += 1;
    }
    if (lit < 3) return null;
    const data = canvas.toDataURL("image/jpeg", 0.92);
    if (data.length < 32) return null;
    stillCache.set(videoUrl, data);
    return data;
  } catch {
    return null;
  }
}
