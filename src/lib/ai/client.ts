// ============================================================
// AIHub — AI Client
// Uses OpenRouter's OpenAI-compatible /v1/chat/completions API.
// Env vars: ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL
// ============================================================

import { DEFAULT_MODEL, FALLBACK_CHAIN, BLOCKED_MODELS } from "./models";

export { FREE_MODELS, DEFAULT_MODEL, FALLBACK_CHAIN, CODE_MODEL } from "./models";

// ─── Config ───────────────────────────────────────────────────────────────────

// OPENROUTER_* is checked first so both this client and /api/generate resolve
// the same endpoint and credential. The ANTHROPIC_* names are the historical
// spelling this project used for its OpenRouter config and still work.
function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || "";
  if (!key) {
    console.warn("[AI] Warning: No API key configured. Set OPENROUTER_API_KEY or ANTHROPIC_AUTH_TOKEN");
  }
  return key;
}

function baseUrl(): string {
  const raw =
    process.env.OPENROUTER_BASE_URL ||
    process.env.ANTHROPIC_BASE_URL ||
    process.env.NEXT_PUBLIC_OPENROUTER_BASE_URL ||
    "https://openrouter.ai/api";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function primaryModel(override?: string): string {
  return (
    override ||
    process.env.ANTHROPIC_MODEL ||
    process.env.AI_MODEL ||
    DEFAULT_MODEL
  );
}

// Fallback chain lives in ./models.ts — ordered by measured latency against a
// real structured generation. See that file for the benchmark numbers.
const FALLBACK_MODELS = FALLBACK_CHAIN;

// OpenRouter retires free tiers without notice; a retired model answers 404
// "This model is unavailable for free". Remember those for the lifetime of the
// process so we stop paying a round trip for them on every subsequent call.
const deadModels = new Set<string>(BLOCKED_MODELS);

function isUsable(model: string): boolean {
  return !deadModels.has(model);
}

/**
 * A leaked chain-of-thought opens with first-person planning prose rather than
 * the artifact. Used both to trim a trace off the front of a real answer and to
 * reject a response that is nothing but the trace.
 */
const REASONING_TELL =
  /^(?:we need to|we should|i need to|i should|let me|let's|okay,|ok,|first,|the user (?:wants|asks|is asking)|thinking:|alright,|so,? the (?:task|user)|hmm)/i;

export function looksLikeReasoning(s: string): boolean {
  return REASONING_TELL.test(s.trimStart());
}

/**
 * Most surviving free models are reasoning models. We ask OpenRouter to drop
 * the reasoning trace, but a few providers ignore that and duplicate their
 * chain-of-thought into `content` anyway — which is how raw "We need to output
 * JSON only..." prose ended up rendered in the UI. Strip the obvious tells.
 *
 * When the trace precedes a real artifact this cuts it off. When the response
 * is *only* a trace there is nothing to cut, so the text is returned unchanged
 * and the per-type validator rejects it via looksLikeReasoning().
 */
export function sanitizeContent(raw: string): string {
  let s = raw
    // Some Nemotron builds emit long <unk> runs when the reasoning channel is suppressed
    .replace(/(?:<unk>\s*){3,}/g, " ")
    // Explicit reasoning delimiters used by several open-weight models
    .replace(/<\/?(?:think|thinking|reasoning|analysis)>/gi, "")
    .trim();

  if (looksLikeReasoning(s)) {
    const jsonStart = s.search(/[[{]/);
    const mdStart = s.search(/^#{1,3}\s/m);
    const cut = [jsonStart, mdStart].filter((i) => i > 0).sort((a, b) => a - b)[0];
    if (cut !== undefined) s = s.slice(cut).trim();
  }

  return s;
}

// OpenRouter caps free-tier accounts at 50 free-model requests/day (1000 with
// credit on the account). The cap is account-wide, so once it trips every
// model in the chain fails identically and falling back cannot help.
const QUOTA_MARKER = "free-models-per-day";
export const QUOTA_MESSAGE =
  "Daily free-model limit reached on this OpenRouter account. It resets at 00:00 UTC — or add $10 of credit at openrouter.ai/settings/credits to raise the cap to 1000 requests/day.";

export class QuotaExceededError extends Error {
  constructor() {
    super(QUOTA_MESSAGE);
    this.name = "QuotaExceededError";
  }
}

/** Content that is present but useless — all whitespace, punctuation, or <unk>. */
export function isDegenerate(content: string): boolean {
  const s = content.trim();
  if (s.length < 20) return true;
  if ((s.match(/<unk>/g) ?? []).length > 5) return true;
  return !/[a-z0-9]{3}/i.test(s);
}

// Strip non-ASCII chars from header values — HTTP headers only allow bytes 0-255.
function toAscii(s: string) {
  return s.replace(/[^\x00-\x7F]/g, "");
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${toAscii(apiKey())}`,
    "HTTP-Referer": toAscii(process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    "X-Title": "AIHub",
  };
}

// ─── Core fetch with retry + model fallback ───────────────────────────────────

interface OAMessage {
  role: "system" | "user" | "assistant";
  content: string;
}


export async function callModel(
  messages: OAMessage[],
  maxTokens: number,
  modelOverride?: string,
  temperature = 0.7,
  timeoutMs = 18_000,
): Promise<string> {
  const models = [...new Set([primaryModel(modelOverride), ...FALLBACK_MODELS])].filter(isUsable);
  const url = `${baseUrl()}/chat/completions`;
  let lastError: Error = new Error("No models tried");

  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: headers(),
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          // Suppress chain-of-thought two ways: `reasoning.exclude` is the
          // current OpenRouter contract, `include_reasoning` the legacy one.
          // Without this, reasoning eats the whole token budget and content
          // comes back empty or truncated mid-JSON.
          reasoning: { exclude: true },
          include_reasoning: false,
          temperature,
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const txt = await res.text().catch(() => `HTTP ${res.status}`);
        // 404 = free tier retired. Never try this model again this process.
        if (res.status === 404) deadModels.add(model);
        if (res.status === 429 && txt.includes(QUOTA_MARKER)) throw new QuotaExceededError();
        throw new Error(`${model} → ${res.status}: ${txt.slice(0, 200)}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(`${model} error: ${data.error.message || data.error.code}`);
      }

      const content = sanitizeContent(data.choices?.[0]?.message?.content ?? "");
      if (!content) throw new Error(`${model} returned empty content`);
      if (isDegenerate(content)) throw new Error(`${model} returned degenerate content`);

      console.log(`[AI] Success with model: ${model}`);
      return content;
    } catch (err) {
      clearTimeout(timeoutId);
      // Account-wide cap — every remaining model would 429 too.
      if (err instanceof QuotaExceededError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[AI] Model ${model} failed: ${lastError.message} — trying next`);
    }
  }

  throw new Error(`All models failed. Last error: ${lastError.message}`);
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export async function chat(
  system: string,
  userMessage: string,
  maxTokens = 2048,
  modelOverride?: string,
): Promise<string> {
  return callModel(
    [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
    maxTokens,
    modelOverride,
  );
}

export async function chatWithHistory(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens = 1024,
  modelOverride?: string
): Promise<string> {
  // OpenRouter requires conversations to start with a user message
  const trimmed = messages.reduce<Array<{ role: "user" | "assistant"; content: string }>>(
    (acc, msg) => {
      if (acc.length === 0 && msg.role === "assistant") return acc;
      return [...acc, msg];
    },
    []
  );

  if (trimmed.length === 0) return "";

  return callModel(
    [
      { role: "system", content: system },
      ...trimmed,
    ],
    maxTokens,
    modelOverride,
  );
}

// ─── JSON Parsing ─────────────────────────────────────────────────────────────

export function extractJson(raw: string): string {
  // Strip markdown code fences
  let s = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();

  // Advance to the first opening brace
  const start = s.indexOf("{");
  if (start > 0) s = s.slice(start);

  // Fix trailing commas before } or ] — common model mistake
  s = s.replace(/,(\s*[}\]])/g, "$1");

  // Count unclosed braces/brackets to repair truncated JSON
  let braces = 0, brackets = 0, inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }

  // Append closing braces/brackets as needed
  while (braces > 0) { s += "}"; braces--; }
  while (brackets > 0) { s += "]"; brackets--; }

  return s;
}
