import { OllamaModel, ChatMessage } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";

export async function fetchOllamaModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.models ?? [];
  } catch {
    return [];
  }
}

export async function chatWithOllama(
  messages: ChatMessage[],
  model: string,
  options?: { stream?: boolean }
): Promise<Response> {
  return fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: options?.stream ?? false,
    }),
  });
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
