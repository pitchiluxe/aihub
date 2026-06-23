import { NextRequest, NextResponse } from "next/server";
import { ResearchPaper } from "@/types";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// NEVER cache — always fetch live data
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getClientIp(req), 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "large language models";
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const [arxiv, semantic, hfDaily, pwc] = await Promise.allSettled([
    fetchArxiv(query, Math.ceil(limit * 0.4)),
    fetchSemanticScholar(query, Math.ceil(limit * 0.25)),
    fetchHuggingFaceDaily(query),
    fetchPapersWithCode(query, 10),
  ]);

  const papers: ResearchPaper[] = [];

  // HuggingFace daily papers first — freshest content
  if (hfDaily.status === "fulfilled") papers.push(...hfDaily.value);
  if (pwc.status === "fulfilled") papers.push(...pwc.value);
  if (arxiv.status === "fulfilled") papers.push(...arxiv.value);
  if (semantic.status === "fulfilled") papers.push(...semantic.value);

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = papers.filter((p) => {
    const key = p.title.toLowerCase().replace(/\s+/g, " ").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date — most recent first
  unique.sort((a, b) =>
    new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
  );

  return NextResponse.json(
    { papers: unique.slice(0, limit), total: unique.length },
    {
      headers: {
        // 2-minute browser cache, always revalidate in background
        "Cache-Control": "public, max-age=120, stale-while-revalidate=60",
      },
    }
  );
}

// ── arXiv: last 7 days, all major AI categories ──────────────────────────────
async function fetchArxiv(query: string, limit: number): Promise<ResearchPaper[]> {
  // Search across all major AI/ML arXiv categories
  const cats = "cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:cs.RO OR cat:stat.ML";
  const search = encodeURIComponent(`(ti:${query} OR abs:${query}) AND (${cats})`);
  const url = `https://export.arxiv.org/api/query?search_query=${search}&start=0&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`;

  const res = await fetch(url, {
    cache: "no-store",                     // ← always fetch live
    headers: { "User-Agent": "AIHub/2.0 Research Reader" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];

  return entries.map((entry): ResearchPaper => {
    const get = (tag: string) =>
      entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`))?.[1]?.trim() ?? "";

    const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)].map((m) => m[1]);
    const rawId = get("id");
    const arxivId = rawId.split("/abs/").pop() ?? rawId.split("/pdf/").pop() ?? "";
    const cats = entry.match(/arxiv:term="([^"]+)"/g)?.map(m => m.match(/"([^"]+)"/)?.[1] ?? "") ?? [];
    const published = get("published");

    return {
      id: `arxiv-${arxivId}`,
      title: get("title").replace(/\s+/g, " ").trim(),
      authors: authors.slice(0, 6),
      abstract: get("summary").replace(/\s+/g, " ").trim().slice(0, 600) + "…",
      url: `https://arxiv.org/abs/${arxivId}`,
      arxivId,
      publishedAt: published,
      categories: cats.filter(Boolean).slice(0, 4),
      source: "arXiv",
    };
  }).filter(p => p.title && p.arxivId);
}

// ── Semantic Scholar: sorted by date, recent papers ──────────────────────────
async function fetchSemanticScholar(query: string, limit: number): Promise<ResearchPaper[]> {
  const fields = "title,abstract,authors,year,publicationDate,externalIds,citationCount,tldr,openAccessPdf,fieldsOfStudy";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}&sort=PublicationDate`;

  const res = await fetch(url, {
    cache: "no-store",                     // ← always fetch live
    headers: { "User-Agent": "AIHub/2.0 Research Reader" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.data ?? [])
    .filter((p: any) => p.publicationDate || p.year)
    .map((p: any): ResearchPaper => ({
      id: `ss-${p.paperId ?? Math.random().toString(36).slice(2)}`,
      title: p.title ?? "Untitled",
      authors: (p.authors ?? []).map((a: any) => a.name ?? "").slice(0, 6),
      abstract: (p.abstract?.slice(0, 600) ?? "") + "…",
      url: p.openAccessPdf?.url ?? `https://www.semanticscholar.org/paper/${p.paperId}`,
      arxivId: p.externalIds?.ArXiv,
      publishedAt: p.publicationDate ? `${p.publicationDate}` : `${p.year ?? ""}-01-01`,
      categories: (p.fieldsOfStudy ?? ["AI"]).slice(0, 3),
      citations: p.citationCount,
      tldr: p.tldr?.text,
      source: "Semantic Scholar",
    }));
}

// ── Hugging Face Daily Papers — real-time hand-curated feed ──────────────────
async function fetchHuggingFaceDaily(query: string): Promise<ResearchPaper[]> {
  try {
    // HF daily papers: ~10 curated AI papers updated every day
    const res = await fetch("https://huggingface.co/api/daily_papers?limit=20", {
      cache: "no-store",
      headers: { "User-Agent": "AIHub/2.0 Research Reader" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const q = query.toLowerCase();

    return (Array.isArray(data) ? data : data.papers ?? [])
      .filter((p: any) => {
        if (!p.paper?.title) return false;
        // Filter by query relevance (title or summary contains keywords)
        const text = `${p.paper.title} ${p.paper.summary ?? ""}`.toLowerCase();
        const words = q.split(/\s+/).filter(w => w.length > 3);
        // Include if any keyword matches OR query is broad
        return words.length === 0 || words.some(w => text.includes(w)) || q.includes("language") || q.includes("model") || q.includes("ai") || q.includes("llm");
      })
      .map((p: any): ResearchPaper => {
        const paper = p.paper;
        const arxivId = paper.id ?? "";
        return {
          id: `hf-${arxivId}`,
          title: paper.title ?? "Untitled",
          authors: (paper.authors ?? []).map((a: any) => a.name ?? a).slice(0, 6),
          abstract: (paper.summary ?? "").slice(0, 600) + (paper.summary?.length > 600 ? "…" : ""),
          url: `https://arxiv.org/abs/${arxivId}`,
          arxivId,
          publishedAt: p.publishedAt ?? paper.publishedAt ?? new Date().toISOString(),
          categories: ["AI", "Featured"],
          source: "HuggingFace Daily",
          isHot: true,
        };
      });
  } catch {
    return [];
  }
}

// ── Papers With Code: trending ML papers with implementations ──
async function fetchPapersWithCode(query: string, limit: number): Promise<ResearchPaper[]> {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://paperswithcode.com/api/v1/papers/?format=json&q=${q}&ordering=-published&page=1`,
      {
        cache: "no-store",
        headers: { "User-Agent": "AIHub/2.0 Research Reader" },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];

    return results.slice(0, limit).map((p: {
      id?: string;
      arxiv_id?: string;
      title?: string;
      abstract?: string;
      authors?: string[];
      published?: string;
      url_abs?: string;
      url_pdf?: string;
      github_href?: string;
    }): ResearchPaper => ({
      id: `pwc-${p.arxiv_id ?? p.id ?? Math.random()}`,
      title: p.title ?? "Untitled",
      authors: (p.authors ?? []).slice(0, 6),
      abstract: (p.abstract ?? "").slice(0, 600) + ((p.abstract?.length ?? 0) > 600 ? "…" : ""),
      url: p.url_abs ?? `https://paperswithcode.com`,
      arxivId: p.arxiv_id,
      publishedAt: p.published ?? new Date().toISOString(),
      categories: ["ML", "Papers With Code"],
      codeUrl: p.github_href ?? undefined,
      source: "Papers With Code",
      isHot: false,
    }));
  } catch {
    return [];
  }
}
