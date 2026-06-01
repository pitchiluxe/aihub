import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/types";
import { callModel } from "@/lib/ai/client";

// Extend Next.js function timeout beyond the default 60s
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { messages, model, stream = false, provider = "openrouter" } = await req.json();

    if (!messages || !model) {
      return NextResponse.json({ error: "messages and model are required" }, { status: 400 });
    }

    console.log(`[Chat API] Provider: ${provider}, Model: ${model}, Messages: ${messages.length}`);

    // Use Ollama if explicitly requested
    if (provider === "ollama") {
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";

      try {
        const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!ping.ok) throw new Error("not reachable");
      } catch {
        return NextResponse.json(
          {
            error: "Ollama is not running",
            detail: "Start Ollama by opening the Ollama app or running `ollama serve` in a terminal.",
            ollamaInstallUrl: "https://ollama.ai/download",
          },
          { status: 503 }
        );
      }

      try {
        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
          }),
          signal: AbortSignal.timeout(180000),
        });

        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json({ error: `Ollama error: ${errText}` }, { status: res.status });
        }

        const data = await res.json();
        const content = (data.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        return NextResponse.json({ content, model, provider: "ollama" });
      } catch (ollamaErr) {
        const isTimeout = String(ollamaErr).includes("AbortError") || String(ollamaErr).includes("abort");
        return NextResponse.json(
          {
            error: isTimeout
              ? `Ollama timed out loading "${model}". Try again in a moment.`
              : `Ollama request failed: ${String(ollamaErr)}`,
          },
          { status: 503 }
        );
      }
    }

    // Use centralized OpenRouter client with fallback chain
    try {
      const content = await callModel(
        messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        2048,
        model
      );

      return NextResponse.json({
        content,
        model,
        provider: "openrouter",
      });
    } catch (error) {
      console.error("[Chat API] OpenRouter error:", error);

      // Try Ollama as fallback
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";
      try {
        const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (ping.ok) {
          const tagsData = await ping.json();
          const localModels: string[] = (tagsData.models ?? []).map((m: any) => m.name);
          const preferred = ["llama3.2:latest", "llama2:latest", "llama3.1:latest", "mistral:latest"];
          const fallbackModel = preferred.find(m => localModels.includes(m)) ?? localModels[0];

          if (fallbackModel) {
            const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ model: fallbackModel, messages, stream: false }),
              signal: AbortSignal.timeout(180000),
            });

            if (ollamaRes.ok) {
              const data = await ollamaRes.json();
              const content = (data.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
              console.log(`[Chat API] Fallback to Ollama succeeded: ${fallbackModel}`);
              return NextResponse.json({ content, model: fallbackModel, provider: "ollama", fallback: true });
            }
          }
        }
      } catch (ollamaErr) {
        console.warn("[Chat API] Ollama fallback unavailable:", ollamaErr);
      }

      // All options exhausted
      return NextResponse.json(
        {
          error: "All AI models currently unavailable",
          suggestions: [
            "⏱️ Wait 1-2 minutes and retry",
            "🤖 Install Ollama: https://ollama.ai/download",
            "▶️ Start Ollama: ollama serve",
            "🔑 Check ANTHROPIC_AUTH_TOKEN in .env.local",
          ],
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[Chat API] Unexpected error:", err);
    return NextResponse.json({ error: `Internal server error: ${String(err)}` }, { status: 500 });
  }
}
