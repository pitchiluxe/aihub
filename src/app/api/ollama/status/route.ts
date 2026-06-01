import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      return NextResponse.json({
        running: false,
        models: [],
        error: "Ollama not responding",
        installUrl: "https://ollama.ai/download",
      }, { status: 200 });
    }
    
    const data = await res.json();
    const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
    return NextResponse.json({
      running: true,
      models,
      error: null,
    }, { status: 200 });
  } catch (err) {
    const errMsg = String(err);
    const isTimeout = errMsg.includes("AbortError") || errMsg.includes("timeout");
    
    return NextResponse.json({
      running: false,
      models: [],
      error: isTimeout
        ? "Ollama timeout — is it running? Start with: ollama serve"
        : "Ollama not reachable — install from https://ollama.ai/download",
      installUrl: "https://ollama.ai/download",
      startCommand: "ollama serve",
    }, { status: 200 });
  }
}
