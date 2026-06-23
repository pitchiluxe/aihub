import { NextRequest, NextResponse } from "next/server";
import { fetchNewsFromRSS } from "@/lib/news";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getClientIp(req), 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const type = searchParams.get("type") ?? "all";

  if (!q) return NextResponse.json({ results: [] });

  const words = q.split(/\s+/).filter((w) => w.length > 2);

  function score(text: string): number {
    const t = text.toLowerCase();
    let s = 0;
    for (const w of words) if (t.includes(w)) s++;
    if (t.includes(q)) s += 3;
    return s;
  }

  const results: { type: string; id: string; title: string; description: string; url?: string; meta?: string; score: number }[] = [];
  const tasks: Promise<void>[] = [];

  if (type === "all" || type === "news") {
    tasks.push(
      fetchNewsFromRSS().then((articles) => {
        for (const a of articles) {
          const s = score(a.title + " " + a.summary + " " + a.category);
          if (s > 0) results.push({ type: "news", id: a.id, title: a.title, description: a.summary, url: a.url, meta: a.source, score: s });
        }
      }).catch(() => {})
    );
  }

  if (type === "all" || type === "models") {
    tasks.push(
      fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: "Bearer " + (process.env.ANTHROPIC_AUTH_TOKEN ?? "") },
        next: { revalidate: 3600 },
      }).then((r) => r.json()).then((data) => {
        for (const m of (data.data ?? [])) {
          const s = score((m.name ?? m.id) + " " + (m.description ?? ""));
          if (s > 0) results.push({ type: "model", id: m.id, title: m.name ?? m.id, description: (m.description ?? m.id).slice(0, 160), url: "/models", meta: m.pricing?.prompt === "0" ? "Free" : "Paid", score: s });
        }
      }).catch(() => {})
    );
  }

  if (type === "all" || type === "papers") {
    tasks.push(
      fetch("https://export.arxiv.org/api/query?search_query=all:" + encodeURIComponent(q) + "&max_results=15&sortBy=submittedDate&sortOrder=descending")
        .then((r) => r.text()).then((xml) => {
          const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
          for (const entry of entries) {
            const title = (entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").replace(/\n/g, " ").trim();
            const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "").replace(/\n/g, " ").trim().slice(0, 200);
            const url = entry.match(/<id>(https:\/\/arxiv\.org\/abs\/[^<]+)<\/id>/)?.[1] ?? "";
            if (title) results.push({ type: "paper", id: url, title, description: summary, url, meta: "arXiv", score: 2 });
          }
        }).catch(() => {})
    );
  }

  await Promise.all(tasks);
  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({ results: results.slice(0, 50), query: q, count: results.length });
}
