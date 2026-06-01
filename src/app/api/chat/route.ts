import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/types";

// Extend Next.js function timeout beyond the default 60s
export const maxDuration = 300;

// Reliable free models — updated May 2026
const FREE_FALLBACKS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen3-14b:free",
  "microsoft/phi-4:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
];

export async function POST(req: NextRequest) {
  try {
    const { messages, model, stream = false, provider = "openrouter" } = await req.json();

    if (!messages || !model) {
      return NextResponse.json({ error: "messages and model are required" }, { status: 400 });
    }

    if (provider === "ollama") {
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";

      // Quick connectivity check first
      try {
        const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!ping.ok) throw new Error("not reachable");
      } catch {
        return NextResponse.json(
          {
            error: "Ollama is not running",
            detail: "Start Ollama by opening the Ollama app or running `ollama serve` in a terminal, then try again.",
            ollamaInstallUrl: "https://ollama.ai/download",
          },
          { status: 503 }
        );
      }

      // Disable thinking mode for qwen3 models (avoids thousands of extra tokens)
      const isQwen3 = model.startsWith("qwen3");
      const ollamaOptions = isQwen3 ? { think: false } : undefined;

      try {
        // Large models (>4GB) need more time to cold-load; use 3 min timeout
        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            ...(ollamaOptions ? { options: ollamaOptions } : {}),
          }),
          signal: AbortSignal.timeout(180000),
        });
        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json({ error: `Ollama error: ${errText}` }, { status: res.status });
        }
        const data = await res.json();
        // Strip <think>...</think> blocks from response content
        const raw: string = data.message?.content ?? "";
        const content = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        return NextResponse.json({ content, model, provider: "ollama" });
      } catch (ollamaErr) {
        const isTimeout = String(ollamaErr).includes("AbortError") || String(ollamaErr).includes("abort");
        return NextResponse.json(
          {
            error: isTimeout
              ? `Ollama timed out loading "${model}". The model may be too large or still loading — try again in a moment, or switch to a smaller model like llama3.2:latest.`
              : `Ollama request failed: ${String(ollamaErr)}`,
          },
          { status: 503 }
        );
      }
    }

    // OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured in .env.local" }, { status: 500 });
    }

    // Try the requested model, then fall back to reliable free models
    const modelsToTry = [model, ...FREE_FALLBACKS.filter((m) => m !== model)];

    for (const tryModel of modelsToTry) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3005",
            "X-Title": "AIHub",
          },
          body: JSON.stringify({
            model: tryModel,
            messages: messages as ChatMessage[],
            max_tokens: 2048,
            temperature: 0.7,
            stream: false,
          }),
          signal: AbortSignal.timeout(45000),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content ?? "";
          if (content && content.trim()) {
            return NextResponse.json({ content, model: tryModel, provider: "openrouter", usage: data.usage });
          }
        }

        const errBody = await res.text().catch(() => "");
        console.warn(`Model ${tryModel} failed (${res.status}): ${errBody.slice(0, 200)}`);
        // Continue to next fallback
      } catch (fetchErr) {
        console.warn(`Model ${tryModel} network error:`, fetchErr);
      }
    }

    // All OpenRouter models failed — try local Ollama as last resort
    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";
    let ollamaError = "";
    try {
      const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (ping.ok) {
        const tagsData = await ping.json();
        const localModels: string[] = (tagsData.models ?? []).map((m: { name: string }) => m.name);
        const preferred = ["llama3.2:latest", "llama3.1:latest", "mistral:latest", "tinyllama:latest"];
        const fallbackModel = preferred.find(m => localModels.includes(m)) ?? localModels[0];
        if (fallbackModel) {
          const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: fallbackModel, messages, stream: false }),
            signal: AbortSignal.timeout(120000),
          });
          if (ollamaRes.ok) {
            const data = await ollamaRes.json();
            const content = (data.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            return NextResponse.json({ content, model: fallbackModel, provider: "ollama", fallback: true });
          }
        }
      } else {
        ollamaError = "Ollama responded but no models available";
      }
    } catch (err) {
      const errStr = String(err);
      if (errStr.includes("AbortError") || errStr.includes("timeout")) {
        ollamaError = "Ollama timeout — is it running? Start with: ollama serve";
      } else if (errStr.includes("ERR_CONNECTION_REFUSED") || errStr.includes("ECONNREFUSED")) {
        ollamaError = "Ollama connection refused — not running. Start with: ollama serve";
      } else {
        ollamaError = "Ollama not reachable";
      }
    }

    // Return helpful error message with installation info
    return NextResponse.json(
      { 
        error: "All models failed. OpenRouter models are rate-limited. Ollama fallback also unavailable.",
        details: ollamaError || "Ollama not accessible",
        suggestion: "(1) Wait 1 minute and retry, (2) Install Ollama: https://ollama.ai/download, (3) Start Ollama: ollama serve, or (4) Verify OPENROUTER_API_KEY in .env.local",
        installUrl: "https://ollama.ai/download",
        startCommand: "ollama serve",
      },
      { status: 502 }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: `Internal server error: ${String(err)}` }, { status: 500 });
  }
}
