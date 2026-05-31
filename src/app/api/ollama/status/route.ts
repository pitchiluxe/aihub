import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ running: false }, { status: 200 });
    }
    const data = await res.json();
    const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
    return NextResponse.json({ running: true, models }, { status: 200 });
  } catch {
    return NextResponse.json({ running: false, models: [] }, { status: 200 });
  }
}
