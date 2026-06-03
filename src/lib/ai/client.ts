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

// Fallback chain — verified working. Free models with wide availability.
const FALLBACK_MODELS = [
  "deepseek/deepseek-v4-flash:free",
  "deepseek/deepseek-chat",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "openai/gpt-oss-20b:free",
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

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function callModel(
  messages: OAMessage[],
  maxTokens: number,
  modelOverride?: string,
  temperature = 0.7,
): Promise<string> {
  const models = [primaryModel(modelOverride), ...FALLBACK_MODELS];
  const url = `${baseUrl()}/chat/completions`;
  let lastError: Error = new Error("No models tried");

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            include_reasoning: false,
            temperature,
          }),
        });

        // Rate-limited: wait briefly then retry once before moving to next model
        if (res.status === 429) {
          if (attempt === 0) {
            console.warn(`[AI] Rate limited on ${model}, retrying...`);
            await sleep(1500);
            continue;
          }
          throw new Error(`429 rate-limited on ${model}`);
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(`${model} → ${res.status}: ${txt.slice(0, 200)}`);
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(`${model} error: ${data.error.message}`);
        }

        const content: string = data.choices?.[0]?.message?.content ?? "";
        if (!content) throw new Error(`${model} returned empty content`);

        console.log(`[AI] Success with model: ${model.split('/')[0]}`);
        return content;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Only retry the 429 path; for other errors move straight to next model
        if (!lastError.message.includes("429")) break;
      }
    }
    // Log the failure and try the next model in the waterfall
    console.warn(`[AI] Model ${model} failed: ${lastError.message} — trying next`);
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
