// ============================================================
// AIHub — Live OpenRouter model catalogue
//
// Ported from AIHub-Browser (src/main/index.ts). A hardcoded model list is the
// problem it tries to solve: OpenRouter retires free-tier slugs without notice,
// so any fixed list drifts stale and starts eating 404 "unavailable for free"
// round trips — one per dead model, on every request. Pull the live catalogue
// instead and intersect it with our curated order.
// ============================================================

import { FALLBACK_CHAIN, BLOCKED_MODELS } from "./models";

const CATALOG_TTL_MS = 30 * 60_000;

let cache: { ids: string[]; ts: number } | null = null;

/** Every model OpenRouter currently serves for free, live. */
export async function liveFreeModels(baseUrl: string): Promise<string[]> {
  if (cache && Date.now() - cache.ts < CATALOG_TTL_MS) return cache.ids;
  try {
    const res = await fetch(`${baseUrl}/models`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return cache?.ids ?? [];
    const data = (await res.json())?.data ?? [];
    const ids: string[] = data
      .filter(
        (m: { id?: string; pricing?: { prompt?: string; completion?: string } }) =>
          m.id?.endsWith(":free") ||
          (m.pricing?.prompt === "0" && m.pricing?.completion === "0"),
      )
      .map((m: { id: string }) => m.id)
      .filter((id: string) => !BLOCKED_MODELS.includes(id));
    if (ids.length) cache = { ids, ts: Date.now() };
    return ids.length ? ids : (cache?.ids ?? []);
  } catch {
    return cache?.ids ?? [];
  }
}

/**
 * Ordered candidates for one request:
 *   1. the configured model, if it is actually still alive
 *   2. our benchmarked chain, filtered against the live catalogue so retired
 *      entries silently drop out instead of costing a round trip
 *   3. any remaining live free model, as a last resort
 *
 * If the catalogue fetch fails entirely we fall back to the static chain rather
 * than refusing to try anything.
 */
export async function buildCandidates(baseUrl: string, preferred?: string): Promise<string[]> {
  const live = await liveFreeModels(baseUrl);
  const usable = (m: string | undefined): m is string => Boolean(m) && !BLOCKED_MODELS.includes(m!);

  if (!live.length) {
    return [...new Set([preferred, ...FALLBACK_CHAIN].filter(usable))];
  }

  const liveSet = new Set(live);
  return [
    ...new Set(
      [
        ...(preferred && liveSet.has(preferred) ? [preferred] : []),
        ...FALLBACK_CHAIN.filter((m) => liveSet.has(m)),
        ...live.filter((m) => m !== preferred),
      ].filter(usable),
    ),
  ];
}
