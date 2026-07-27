// ============================================================
// AIHub — Local Ollama provider
//
// Ported from AIHub-Browser (src/main/index.ts), which runs Ollama FIRST and
// treats the cloud as fallback. That ordering is the actual fix for the
// OpenRouter daily cap: free-tier accounts get 50 free-model requests per day,
// and once that trips every hosted model 429s at once. Local inference has no
// cap, so normal use never reaches the ceiling.
//
// Inert where there is no Ollama (Vercel): the probe fails in milliseconds,
// the negative result is cached, and callers fall through to the cloud.
// ============================================================

import { sanitizeContent } from "./client";

/**
 * Force IPv4. On Windows, Node resolves "localhost" to ::1 first, but Ollama
 * binds 127.0.0.1 only — the mismatch surfaces as ECONNREFUSED ::1:11434.
 * This bit cost real debugging time in AIHub-Browser; do not "simplify" it.
 */
function baseUrl(): string {
  const raw =
    process.env.OLLAMA_BASE_URL ||
    process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ||
    "http://127.0.0.1:11434";
  return raw.replace(/\/+$/, "").replace("://localhost", "://127.0.0.1");
}

/**
 * Preference order among *installed* models, by measured time-to-valid-JSON on
 * this project's structured prompts: qwen2.5:7b 94.7s, llama3.1:8b 121.7s,
 * qwen2.5:14b 231.0s. Anything installed but unlisted is still used, after
 * these — an unknown model beats no model.
 */
const PREFERRED = ["qwen2.5:7b", "llama3.1:8b", "qwen2.5:14b", "mistral:7b"];

/**
 * Never auto-select these. Local "thinking" models spend the whole budget on
 * reasoning and return empty content — the same failure that broke the hosted
 * reasoning models. mistral-nemo emits unparseable JSON; gemma4:12b exceeded
 * 240s on a single idea.
 */
const AVOID = /^(deepseek-r1|qwen3|gpt-oss|gemma4|mistral-nemo|smollm|tinyllama|phi|nomic-embed|llama2)/i;

// Positive results expire quickly (the user can pull new models). A NEGATIVE
// result is cached far longer: with no Ollama installed every probe costs dead
// time on the path to the cloud fallback, re-paid on every single request.
const PROBE_TTL_MS = 5_000;
const MISS_TTL_MS = 120_000;

let probeCache: { at: number; models: string[] } | null = null;

/** Installed models, best-first. Empty when Ollama is unreachable. */
export async function availableOllamaModels(force = false): Promise<string[]> {
  if (!force && probeCache) {
    const ttl = probeCache.models.length ? PROBE_TTL_MS : MISS_TTL_MS;
    if (Date.now() - probeCache.at < ttl) return probeCache.models;
  }

  // Never during `next build`: routes that call a model are prerendered with a
  // 60s per-route budget while local inference takes far longer, which fails
  // the build instead of rescuing it.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    probeCache = { at: Date.now(), models: [] };
    return [];
  }

  const bases = [...new Set([baseUrl(), "http://127.0.0.1:11434"])];
  for (const base of bases) {
    try {
      // Ollama answers in milliseconds when present, so a longer wait only ever
      // adds dead time when it is absent.
      const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (!res.ok) continue;
      const data = (await res.json()) as { models?: Array<{ name?: string }> };
      const installed = (data.models ?? []).map((m) => m.name).filter(Boolean) as string[];
      if (!installed.length) continue;

      const usable = installed.filter((m) => !AVOID.test(m));
      const ordered = [
        ...PREFERRED.filter((m) => usable.includes(m)),
        ...usable.filter((m) => !PREFERRED.includes(m)),
      ];
      const models = [...new Set(ordered)];
      probeCache = { at: Date.now(), models };
      return models;
    } catch {
      /* try the next base */
    }
  }

  probeCache = { at: Date.now(), models: [] };
  return [];
}

/** Strip reasoning tags emitted by DeepSeek-style local models. */
function stripThinkTags(s: string): string {
  return s.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

/**
 * Streamed NDJSON chat.
 *
 * Streaming matters even though we only want the final string: slow hardware
 * and cold model loads otherwise trip the idle timeout mid-generation.
 * num_ctx 8192 because Ollama's 4096 default truncates long structured output,
 * and keep_alive holds the model resident so follow-up calls skip the reload.
 */
async function ollamaChat(
  base: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  idleTimeoutMs: number,
): Promise<string> {
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(idleTimeoutMs),
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      keep_alive: "30m",
      options: { num_ctx: 8192 },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 160)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // One {"message":{"content":"…"},"done":false} object per line
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const j = JSON.parse(line);
        if (j.message?.content) content += j.message.content;
        if (j.error) throw new Error(String(j.error));
      } catch (err) {
        // A partial line is normal — only rethrow a real streamed error.
        if (err instanceof Error && !(err instanceof SyntaxError)) throw err;
      }
    }
  }

  return content;
}

/**
 * Run one prompt through local models until one produces content that passes
 * `validate`. Returns null when Ollama is unavailable or nothing validates, so
 * the caller can fall through to the cloud (or surface its own error).
 */
export async function generateWithOllama(
  system: string,
  user: string,
  _maxTokens: number,
  _temperature: number,
  validate: (content: string) => boolean,
  timeoutMs = 300_000,
): Promise<{ content: string; model: string } | null> {
  const models = await availableOllamaModels();
  if (models.length === 0) return null;

  // `timeoutMs` is the budget for the WHOLE local attempt, not per model.
  // Treating it as per-model let a caller's 75s budget turn into 225s of dead
  // time across three models — past the serverless limit.
  const deadline = Date.now() + timeoutMs;

  // Only the strongest few are worth trying — walking a long install list turns
  // a failed generation into many minutes of dead time.
  for (const model of models.slice(0, 3)) {
    const remaining = deadline - Date.now();
    // Below this, a cold model load alone would consume the rest of the budget.
    if (remaining < 15_000) break;
    try {
      const messages = [
        { role: "system", content: system },
        { role: "user", content: user },
      ];
      const content = sanitizeContent(stripThinkTags(await ollamaChat(baseUrl(), model, messages, remaining)));
      if (!content) throw new Error("empty content");
      if (!validate(content)) throw new Error(`failed validation (${content.length} chars)`);

      console.log(`[Ollama] Served locally by ${model}`);
      return { content, model };
    } catch (err) {
      console.warn(`[Ollama] ${model} rejected: ${err instanceof Error ? err.message : String(err)} — trying next`);
    }
  }

  return null;
}
