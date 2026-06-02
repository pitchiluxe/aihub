import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";

export async function GET() {
  try {
    // Increase timeout to 8 seconds to allow for slower systems
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "Connection": "close" }
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.warn(`[Ollama Status] HTTP ${res.status} from ${OLLAMA_URL}/api/tags`);
      return NextResponse.json({
        running: false,
        models: [],
        error: "Ollama not responding",
        installUrl: "https://ollama.ai/download",
      }, { status: 200 });
    }
    
    const data = await res.json();
    const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
    
    // Ollama is running if we got a valid response with models array
    const isRunning = Array.isArray(data.models) && data.models.length >= 0;
    
    console.log(`[Ollama Status] Running: ${isRunning}, Models: ${models.length}`);
    
    return NextResponse.json({
      running: isRunning,
      models,
      error: null,
    }, { status: 200 });
  } catch (err) {
    const errMsg = String(err);
    const isTimeout = errMsg.includes("AbortError") || errMsg.includes("timeout");
    
    console.error(`[Ollama Status] Error: ${errMsg}`);
    
    return NextResponse.json({
      running: false,
      models: [],
      error: isTimeout
        ? "Ollama timeout — is it running? Start with: ollama serve"
        : `Ollama not reachable at ${OLLAMA_URL}`,
      installUrl: "https://ollama.ai/download",
      startCommand: "ollama serve",
    }, { status: 200 });
  }
}
