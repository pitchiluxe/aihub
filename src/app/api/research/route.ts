import { NextRequest, NextResponse } from "next/server";
import { ResearchPaper } from "@/types";

export const revalidate = 300; // 5 minutes - research papers update periodically

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "large language models";
  const limit = parseInt(searchParams.get("limit") ?? "20");

  try {
    const [arxivPapers, semanticPapers] = await Promise.allSettled([
      fetchArxivPapers(query, Math.ceil(limit / 2)),
      fetchSemanticScholar(query, Math.ceil(limit / 2)),
    ]);

    const papers: ResearchPaper[] = [];

    if (arxivPapers.status === "fulfilled") papers.push(...arxivPapers.value);
    if (semanticPapers.status === "fulfilled") papers.push(...semanticPapers.value);

    const seen = new Set<string>();
    const unique = papers.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return NextResponse.json({
      papers: unique.slice(0, limit),
      total: unique.length,
    });
  } catch (err) {
    console.error("Research API error:", err);
    return NextResponse.json({ papers: [], total: 0, error: "Failed to fetch research" }, { status: 500 });
  }
}

async function fetchArxivPapers(query: string, limit: number): Promise<ResearchPaper[]> {
  const encoded = encodeURIComponent(`(ti:${query} OR abs:${query}) AND cat:cs.AI`);
  const url = `https://export.arxiv.org/api/query?search_query=${encoded}&start=0&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return [];

  const xml = await res.text();
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];

  return entries.map((entry): ResearchPaper => {
    const get = (tag: string) =>
      entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`))?.[1]?.trim() ?? "";

    const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)].map((m) => m[1]);
    const arxivId = get("id").split("/abs/").pop() ?? "";

    return {
      id: `arxiv-${arxivId}`,
      title: get("title").replace(/\s+/g, " "),
      authors: authors.slice(0, 5),
      abstract: get("summary").replace(/\s+/g, " ").slice(0, 500) + "…",
      url: get("id"),
      arxivId,
      publishedAt: get("published"),
      categories: entry.match(/arxiv:term="([^"]+)"/)?.[1]?.split(" ") ?? ["cs.AI"],
      tldr: undefined,
    };
  });
}

async function fetchSemanticScholar(query: string, limit: number): Promise<ResearchPaper[]> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,abstract,authors,year,externalIds,citationCount,tldr,openAccessPdf`;

  const res = await fetch(url, {
    headers: { "User-Agent": "AIHub/1.0" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.data ?? []).map(
    (p: {
      paperId?: string;
      externalIds?: { ArXiv?: string };
      title?: string;
      authors?: Array<{ name?: string }>;
      abstract?: string;
      openAccessPdf?: { url?: string };
      year?: number;
      citationCount?: number;
      tldr?: { text?: string };
    }): ResearchPaper => ({
      id: `ss-${p.paperId ?? Math.random().toString(36).slice(2)}`,
      title: p.title ?? "Untitled",
      authors: (p.authors ?? []).map((a) => a.name ?? "").slice(0, 5),
      abstract: (p.abstract?.slice(0, 500) ?? "") + "…",
      url: p.openAccessPdf?.url ?? `https://www.semanticscholar.org/paper/${p.paperId}`,
      arxivId: p.externalIds?.ArXiv,
      publishedAt: p.year ? `${p.year}-01-01` : new Date().toISOString(),
      categories: ["ai", "ml"],
      citations: p.citationCount,
      tldr: p.tldr?.text,
    })
  );
}
