// ============================================================
// AIHub — AI Models Configuration
// Browser-safe model constants — no server SDK imports here.
// ============================================================

export const FREE_MODELS = [
  // DeepSeek
  { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek Chat V3 (Free)", category: "DeepSeek" },
  { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (Free)", category: "DeepSeek" },

  // Meta Llama (Reliable, high rate limits)
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)", category: "Meta" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)", category: "Meta" },

  // Mistral
  { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B (Free)", category: "Mistral" },

  // Google
  { id: "google/gemma-2-9b-it:free", label: "Gemma 2 9B (Free)", category: "Google" },

  // Qwen3
  { id: "qwen/qwen3-235b-a22b:free", label: "Qwen3 235B (Free)", category: "Qwen" },
  { id: "qwen/qwen3-coder:free", label: "Qwen3 Coder (Free)", category: "Qwen" },
] as const;

export const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324:free";

export type FreeModel = (typeof FREE_MODELS)[number];
