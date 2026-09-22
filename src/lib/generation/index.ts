import { env } from "@/lib/config/env";
import type { VideoGenerationProvider } from "./provider";
import { mockProvider } from "./mock";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * REAL PROVIDER INTEGRATION POINT
 * ──────────────────────────────────────────────────────────────────────────
 * Implement `VideoGenerationProvider` for Kling, Runway, Veo, etc. in a
 * sibling module (e.g. `live.ts`) using `VIDEO_PROVIDER_API_KEY` and
 * `VIDEO_PROVIDER_BASE_URL`. Then select it here based on `VIDEO_PROVIDER`.
 *
 * Do not call vendor APIs from React components.
 * ──────────────────────────────────────────────────────────────────────────
 */
export function getVideoProvider(): VideoGenerationProvider {
  switch (env.videoProvider) {
    case "mock":
    default:
      return mockProvider;
  }
}
