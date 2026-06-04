// ============================================================
// AIHub — AI Client
// Uses OpenRouter's OpenAI-compatible /v1/chat/completions API.
// Env vars: ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL
// ============================================================

import { FREE_MODELS, DEFAULT_MODEL } from "./models";

export { FREE_MODELS, DEFAULT_MODEL } from "./models";

// ─── Config ───────────────────────────────────────────────────────────────────

function apiKey(): string {
  const key = process.env.ANTHROPIC_AUTH_TOKEN || process.env.OPENROUTER_API_KEY || "";
  if (!key) {
    console.warn("[AI] Warning: No API key configured. Set ANTHROPIC_AUTH_TOKEN or OPENROUTER_API_KEY");
  }
  return key;
}

function baseUrl(): string {
  const raw = process.env.ANTHROPIC_BASE_URL || process.env.NEXT_PUBLIC_OPENROUTER_BASE_URL || "https://openrouter.ai/api";
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

// Fallback chain — ordered by reliability. Llama 3.3 70B is the most stable
// free model on OpenRouter for structured JSON output.
const FALLBACK_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "deepseek/deepseek-r1:free",
];

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
  const models = [...new Set([primaryModel(modelOverride), ...FALLBACK_MODELS])];
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
          include_reasoning: false,
          temperature,
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const txt = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(`${model} → ${res.status}: ${txt.slice(0, 200)}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(`${model} error: ${data.error.message || data.error.code}`);
      }

      const content: string = data.choices?.[0]?.message?.content ?? "";
      if (!content) throw new Error(`${model} returned empty content`);

      console.log(`[AI] Success with model: ${model.split('/')[0]}`);
      return content;
    } catch (err) {
      clearTimeout(timeoutId);
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
