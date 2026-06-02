import { NextRequest, NextResponse } from "next/server";

interface DownloadEvent {
  type: "idea" | "website";
  itemId: string;
  itemTitle: string;
  ts: string;
}

// In-memory counters
const counts = new Map<string, number>();
const log: DownloadEvent[] = [];

export async function POST(req: NextRequest) {
  const { type, itemId, itemTitle } = await req.json();
  if (!type || !itemId) return NextResponse.json({ error: "type and itemId required" }, { status: 400 });

  const key = `${type}:${itemId}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
  log.push({ type, itemId, itemTitle: itemTitle ?? itemId, ts: new Date().toISOString() });
  if (log.length > 5000) log.shift(); // cap log

  return NextResponse.json({ count: counts.get(key) });
}

// GET /api/track-download?itemId=xxx&type=idea
export async function GET(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get("itemId");
  const type = req.nextUrl.searchParams.get("type") ?? "idea";
  if (itemId) {
    return NextResponse.json({ count: counts.get(`${type}:${itemId}`) ?? 0 });
  }
  // Return all counts
  const all: Record<string, number> = {};
  for (const [k, v] of counts) all[k] = v;
  return NextResponse.json({ counts: all, total: log.length });
}
