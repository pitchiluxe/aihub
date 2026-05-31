import { ChatMessage, OpenRouterModel } from "@/types";

const BASE_URL = "https://openrouter.ai/api/v1";
const API_KEY = process.env.OPENROUTER_API_KEY ?? "";

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`OpenRouter models fetch failed: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}

export async function chatWithOpenRouter(
  messages: ChatMessage[],
  model: string,
  options?: { maxTokens?: number; temperature?: number; stream?: boolean }
): Promise<Response> {
  return fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "AIHub",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      stream: options?.stream ?? false,
    }),
  });
}

export async function getFreeModels(): Promise<OpenRouterModel[]> {
  const models = await fetchOpenRouterModels();
  return models.filter(
    (m) =>
      m.pricing.prompt === "0" ||
      m.pricing.prompt === "0.0" ||
      parseFloat(m.pricing.prompt) === 0 ||
      m.id.includes(":free")
  );
}

export function normalizeModelId(id: string): string {
  return id.replace(/:free$/, "");
}
