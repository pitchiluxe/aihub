import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/types";

// Extend Next.js function timeout beyond the default 60s
export const maxDuration = 300;

// High-quality free models — ordered by reliability and response quality
const FREE_FALLBACKS = [
  "deepseek/deepseek-chat-v3-0324:free",  // Best reasoning and code
  "meta-llama/llama-3.2-3b-instruct:free", // Fast, reliable
  "meta-llama/llama-3.1-8b-instruct:free", // Good balance
  "mistralai/mistral-small-3.1-24b-instruct:free",  // Good reasoning
  "nvidia/llama-3.1-nemotron-70b-instruct:free",    // Advanced
  "qwen/qwen3-14b:free",                  // Good all-rounder
  "google/gemma-2-9b-it:free",            // Reliable fallback
  "microsoft/phi-4:free",                 // Fast fallback
];

export async function POST(req: NextRequest) {
  try {
    const { messages, model, stream = false, provider = "openrouter" } = await req.json();

    if (!messages || !model) {
      return NextResponse.json({ error: "messages and model are required" }, { status: 400 });
    }

    // Log request for debugging
    console.log(`[Chat API] Provider: ${provider}, Model: ${model}, Messages: ${messages.length}`);

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
        console.log(`[OpenRouter] Trying model: ${tryModel}`);
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
            top_p: 0.95,
            stream: false,
          }),
          signal: AbortSignal.timeout(45000),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content ?? "";
          if (content && content.trim()) {
            console.log(`[OpenRouter] ✅ Success with model: ${tryModel}`);
            return NextResponse.json({ content, model: tryModel, provider: "openrouter", usage: data.usage });
          }
        }

        const errBody = await res.text().catch(() => "");
        const statusCode = res.status;
        console.warn(`[OpenRouter] ❌ Model ${tryModel} failed (${statusCode}): ${errBody.slice(0, 200)}`);
        
        // Don't retry immediately on auth or rate limit errors
        if (statusCode === 401 || statusCode === 403) {
          console.error(`[OpenRouter] Auth error with API key - stopping fallback chain`);
          break;
        }
        // Continue to next fallback on timeout/overload errors
      } catch (fetchErr) {
        console.warn(`[OpenRouter] Network error with ${tryModel}:`, fetchErr);
      }
    }

    // All OpenRouter models failed — try local Ollama as last resort
    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";
    let ollamaError = "";
    let ollamaAttempted = false;
    try {
      console.log(`[Ollama] Attempting fallback to local Ollama at ${ollamaUrl}`);
      const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (ping.ok) {
        ollamaAttempted = true;
        const tagsData = await ping.json();
        const localModels: string[] = (tagsData.models ?? []).map((m: { name: string }) => m.name);
        console.log(`[Ollama] ✅ Found ${localModels.length} local models:`, localModels);
        
        // Prefer larger, better models for quality
        const preferred = ["llama3.2:latest", "llama2:latest", "llama3.1:latest", "mistral:latest", "tinyllama:latest"];
        const fallbackModel = preferred.find(m => localModels.includes(m)) ?? localModels[0];
        
        if (fallbackModel) {
          console.log(`[Ollama] Using model: ${fallbackModel}`);
          const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: fallbackModel, messages, stream: false }),
            signal: AbortSignal.timeout(180000),
          });
          if (ollamaRes.ok) {
            const data = await ollamaRes.json();
            const content = (data.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            console.log(`[Ollama] ✅ Success with ${fallbackModel}`);
            return NextResponse.json({ content, model: fallbackModel, provider: "ollama", fallback: true });
          } else {
            console.warn(`[Ollama] Request failed with status ${ollamaRes.status}`);
            ollamaError = "Ollama failed to process request";
          }
        } else {
          console.warn(`[Ollama] No suitable models found`);
          ollamaError = "No suitable models available in Ollama";
        }
      } else {
        ollamaError = "Ollama server found but not responding correctly";
      }
    } catch (err) {
      const errStr = String(err);
      console.warn(`[Ollama] Connection error:`, errStr);
      if (errStr.includes("AbortError") || errStr.includes("timeout")) {
        ollamaError = "Ollama timeout — is it running? Start with: ollama serve";
      } else if (errStr.includes("ERR_CONNECTION_REFUSED") || errStr.includes("ECONNREFUSED")) {
        ollamaError = "Ollama not running. Start it: ollama serve";
      } else {
        ollamaError = "Ollama not reachable. Is it installed?";
      }
    }

    // Return comprehensive error message with installation info
    console.error(`[Chat API] All models exhausted. Ollama attempted: ${ollamaAttempted}, Error: ${ollamaError}`);
    return NextResponse.json(
      { 
        error: "All AI models currently unavailable",
        details: ollamaError || "No models accessible",
        suggestions: [
          "⏱️ Wait 1-2 minutes and retry (OpenRouter rate limit resets)",
          "🤖 Install Ollama for offline AI: https://ollama.ai/download",
          "▶️ Run Ollama: ollama serve",
          "🔑 Check OPENROUTER_API_KEY in .env.local",
        ],
        ollamaAvailable: ollamaAttempted,
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
