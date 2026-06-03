import { NextRequest, NextResponse } from "next/server";
import { SearchResult } from "@/types";
import { callModel } from "@/lib/ai/client";
import { fetchNewsFromRSS } from "@/lib/news";
import { fetchOpenRouterModels } from "@/lib/openrouter";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  const [newsResult, modelsResult] = await Promise.allSettled([
    fetchNewsFromRSS(),
    fetchOpenRouterModels(),
  ]);

  if (newsResult.status === "fulfilled") {
    const matched = newsResult.value
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      )
      .slice(0, 10);

    for (const a of matched) {
      results.push({
        id: a.id,
        type: "news",
        title: a.title,
        description: a.summary,
        url: a.url,
        source: a.source,
        publishedAt: a.publishedAt,
        relevanceScore: scoreRelevance(q, a.title, a.summary),
      });
    }
  }

  if (modelsResult.status === "fulfilled") {
    const matched = modelsResult.value
      .filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      )
      .slice(0, 10);

    for (const m of matched) {
      results.push({
        id: m.id,
        type: "model",
        title: m.name ?? m.id,
        description: m.description ?? `Context: ${m.context_length?.toLocaleString()} tokens`,
        relevanceScore: scoreRelevance(q, m.name ?? "", m.description ?? ""),
      });
    }
  }

  // Use AI to generate a summary answer for the query (optional)
  let aiAnswer: string | undefined;
  let aiUnavailable = false;
  try {
    const answer = await callModel(
      [
        {
          role: "system",
          content:
            "You are an AI search assistant specialized in artificial intelligence. Provide a concise, factual answer to the user's query in 2-3 sentences. Only answer AI-related questions.",
        },
        { role: "user", content: query },
      ],
      256,
      "deepseek/deepseek-chat-v3-0324:free",
    );
    if (answer) aiAnswer = answer;
  } catch (err) {
    // AI answer is optional - still return search results
    aiUnavailable = true;
    console.warn("AI answer generation failed:", err);
  }

  results.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  return NextResponse.json({
    results: results.slice(0, 20),
    total: results.length,
    aiAnswer,
    aiUnavailable,
  });
}

function scoreRelevance(query: string, title: string, description: string): number {
  let score = 0;
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  if (t.startsWith(query)) score += 10;
  if (t.includes(query)) score += 5;
  if (d.includes(query)) score += 2;
  return score;
}
