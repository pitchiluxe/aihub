import { OllamaModel, ChatMessage } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";

export async function fetchOllamaModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
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
    signal: AbortSignal.timeout(180000),
  });
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface OllamaStatus {
  running: boolean;
  models: string[];
  error?: string;
  installUrl?: string;
}

export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        running: false,
        models: [],
        error: "Ollama is not responding. Make sure it's installed and running: ollama serve",
        installUrl: "https://ollama.ai/download",
      };
    }
    const data = await res.json();
    const models = (data.models ?? []).map((m: { name: string }) => m.name);
    return { running: true, models };
  } catch (err) {
    const errMsg = String(err);
    if (errMsg.includes("AbortError") || errMsg.includes("timeout")) {
      return {
        running: false,
        models: [],
        error: "Ollama is not responding (timeout). Start it with: ollama serve",
        installUrl: "https://ollama.ai/download",
      };
    }
    return {
      running: false,
      models: [],
      error: "Could not connect to Ollama. Install from https://ollama.ai or run 'ollama serve'",
      installUrl: "https://ollama.ai/download",
    };
  }
}
