// ============================================================
// AIHub — Ollama fallback
//
// OpenRouter's free tier is capped per day (50 requests, or 1000 with credit
// on the account). When that cap trips, every hosted model 429s at once and
// falling back between them cannot help — the generators simply stop working
// until 00:00 UTC.
//
// Ollama runs models on the user's own machine with no cap, so it is used as a
// last resort after the hosted chain is exhausted. It is naturally local-only:
// on Vercel there is no Ollama to reach, the availability probe fails in
// milliseconds, and the caller reports the quota error as before.
// ============================================================

import { sanitizeContent } from "./client";

function baseUrl(): string {
  const raw =
    process.env.OLLAMA_BASE_URL ||
    process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ||
    "http://localhost:11434";
  return raw.replace(/\/+$/, "");
}

/**
 * Local models ordered by measured time-to-valid-JSON on this project's
 * structured-output prompts (CPU inference, cold start included):
 *
 *   qwen2.5:7b    94.7s
 *   llama3.1:8b  121.7s
 *   qwen2.5:14b  231.0s
 *
 * Deliberately excluded: mistral-nemo (emits unparseable JSON), gemma4:12b
 * (exceeded 240s), and the local "thinking" models such as qwen3.6 — their
 * reasoning consumes the whole budget and content comes back empty, the same
 * failure that broke the hosted reasoning models.
 */
export const OLLAMA_MODELS: readonly string[] = [
  "qwen2.5:7b",
  "llama3.1:8b",
  "qwen2.5:14b",
];

/** Models installed locally, intersected with the ones we trust, in our order. */
let cachedAvailable: string[] | null = null;

export async function availableOllamaModels(): Promise<string[]> {
  if (cachedAvailable) return cachedAvailable;

  // Never during `next build`. Routes that call a model are prerendered with a
  // 60s per-route budget, and local inference takes 90-240s — letting the
  // fallback run there fails the build instead of rescuing it. This is a
  // developer-runtime convenience only.
  if (process.env.NEXT_PHASE === "phase-production-build") return (cachedAvailable = []);

  try {
    const res = await fetch(`${baseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return (cachedAvailable = []);
    const data = (await res.json()) as { models?: Array<{ name?: string }> };
    const installed = new Set((data.models ?? []).map((m) => m.name).filter(Boolean) as string[]);
    return (cachedAvailable = OLLAMA_MODELS.filter((m) => installed.has(m)));
  } catch {
    // No Ollama here (the normal case in production) — fail fast and quietly.
    return (cachedAvailable = []);
  }
}

/**
 * Run one prompt through local models until one produces content that passes
 * `validate`. Returns null when Ollama is unavailable or nothing validates, so
 * the caller can surface its original hosted-provider error.
 */
export async function generateWithOllama(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
  validate: (content: string) => boolean,
  timeoutMs = 300_000,
): Promise<{ content: string; model: string } | null> {
  const models = await availableOllamaModels();
  if (models.length === 0) return null;

  for (const model of models) {
    try {
      const res = await fetch(`${baseUrl()}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const content = sanitizeContent(data.choices?.[0]?.message?.content ?? "");
      if (!content) throw new Error("empty content");
      if (!validate(content)) throw new Error(`failed validation (${content.length} chars)`);

      console.log(`[Ollama] Served locally by ${model}`);
      return { content, model };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Ollama] ${model} rejected: ${msg} — trying next`);
    }
  }

  return null;
}
