/** Prefer a stored still; for Cloudflare Stream, derive one from the playback URL. */
export function stillFromVideo(videoUrl: string | null, thumbnailUrl: string | null) {
  if (thumbnailUrl) return thumbnailUrl;
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    if (!url.hostname.endsWith("cloudflarestream.com")) return null;
    const uid = url.pathname.split("/").filter(Boolean)[0];
    if (!uid) return null;
    return `${url.origin}/${uid}/thumbnails/thumbnail.jpg?time=1s&height=720`;
  } catch {
    return null;
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
    const max = 640;
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
    const data = canvas.toDataURL("image/jpeg", 0.72);
    if (data.length < 32) return null;
    stillCache.set(videoUrl, data);
    return data;
  } catch {
    return null;
  }
}
