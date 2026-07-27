// ============================================================
// AIHub — AI Models Configuration
// Browser-safe model constants — no server SDK imports here.
//
// IMPORTANT: OpenRouter retires free tiers frequently. Every id below was
// verified live against https://openrouter.ai/api/v1/models AND a real
// streaming completion. Models that 404 with "This model is unavailable for
// free" (llama-3.3-70b, gpt-oss-120b, qwen3-coder, kimi-k2.6,
// mistral-small-3.1, deepseek-r1, qwen-2.5-72b, gemma-3-27b, hermes-3) were
// removed — they made every generator fall through its whole chain and fail.
//
// Re-verify with:  npm run verify:models
// ============================================================

export const FREE_MODELS = [
  // NVIDIA Nemotron — fastest reliable free structured-output models
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "Nemotron 3 Nano Omni 30B (Free)", category: "NVIDIA" },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free",                label: "Nemotron 3 Nano 30B (Free)",       category: "NVIDIA" },
  { id: "nvidia/nemotron-nano-9b-v2:free",                    label: "Nemotron Nano 9B (Free)",          category: "NVIDIA" },

  // InclusionAI
  { id: "inclusionai/ling-3.0-flash:free", label: "Ling 3.0 Flash (Free)", category: "InclusionAI" },

  // Google Gemma 4
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B (Free)", category: "Google" },
  { id: "google/gemma-4-31b-it:free",     label: "Gemma 4 31B (Free)", category: "Google" },

  // Poolside Laguna
  { id: "poolside/laguna-xs-2.1:free", label: "Laguna XS 2.1 (Free)", category: "Poolside" },
  { id: "poolside/laguna-s-2.1:free",  label: "Laguna S 2.1 (Free)",  category: "Poolside" },

  // Cohere
  { id: "cohere/north-mini-code:free", label: "North Mini Code (Free)", category: "Cohere" },

  // OpenAI OSS
  { id: "openai/gpt-oss-20b:free", label: "GPT OSS 20B (Free)", category: "OpenAI" },
] as const;

/**
 * Fallback chain ordered by *measured* time-to-complete-JSON on a ~4000-token
 * structured generation, so the common path never waits on a slow model:
 *
 *   nemotron-3-nano-omni   5.1s
 *   ling-3.0-flash         5.9s
 *   nemotron-3-nano-30b   12.8s
 *   nemotron-nano-9b      27.8s
 *   gemma-4-26b           28.3s
 *   laguna-xs-2.1         65.5s
 *   north-mini-code       71.8s
 *   gpt-oss-20b           90.6s
 *
 * gemma-4-31b and laguna-s-2.1 sit last — they work but are frequently 429.
 */
export const FALLBACK_CHAIN: readonly string[] = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "inclusionai/ling-3.0-flash:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-4-26b-a4b-it:free",
  "poolside/laguna-xs-2.1:free",
  "cohere/north-mini-code:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
  "poolside/laguna-s-2.1:free",
];

/**
 * Free-tier models that exist but must never be used:
 *   nemotron-3-super-120b   — streams chain-of-thought into delta.content and
 *                             degenerates into <unk> spam
 *   nemotron-nano-12b-v2-vl — vision model, will not honour JSON instructions
 *   laguna-m.1              — returns empty content, reasoning only
 *   nemotron-3-ultra-550b   — permanently ResourceExhausted
 *   nemotron-3.5-content-safety — safety classifier, not a chat model
 */
export const BLOCKED_MODELS: readonly string[] = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "poolside/laguna-m.1:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-content-safety:free",
];

export const DEFAULT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

/** Best free model for long-form code and markdown rather than JSON. */
export const CODE_MODEL = "cohere/north-mini-code:free";

export type FreeModel = (typeof FREE_MODELS)[number];
