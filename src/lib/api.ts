const TOKEN_KEY = "gener8_token";

export function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = apiBase();
  return base ? `${base}${p}` : p;
}

/** Drop media URLs that point at a local API the browser cannot reach. */
export function mediaUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return input;
  }
  const loopback = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (!loopback) return input;
  const api = apiBase();
  if (!api) return null;
  try {
    const apiHost = new URL(api).hostname;
    if (apiHost === "127.0.0.1" || apiHost === "localhost") return input;
  } catch {
    return null;
  }
  return null;
}

export function getApiToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setApiToken(token: string | null) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getApiToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const isForm =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !headers.has("Content-Type") && !isForm) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  }).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : "network error";
    throw new Error(`Couldn’t reach the Gener8 API (${reason}). Is it running on port 4000?`);
  });
}
