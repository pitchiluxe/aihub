import { NextResponse } from "next/server";
import { fetchNewsFromRSS } from "@/lib/news";

export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const articles = await fetchNewsFromRSS();
    const latest = articles.slice(0, 15);

    // Build a rich digest text from the top articles
    const digest = latest
      .map(
        (a, i) =>
          `[Article ${i + 1}] ${a.title}\nSource: ${a.source} | Published: ${new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\nURL: ${a.url}\nSummary: ${a.summary}\nTags: ${a.tags.join(", ")}`
      )
      .join("\n\n---\n\n");

    const fullText = `# AIHub Daily AI Digest\nCompiled: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\nSources: ${[...new Set(latest.map((a) => a.source))].join(", ")}\n\n${digest}`;

    return NextResponse.json({
      articles: latest.map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        source: a.source,
        summary: a.summary,
        publishedAt: a.publishedAt,
        tags: a.tags,
      })),
      digest: fullText,
      count: latest.length,
      compiledAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Digest error:", err);
    return NextResponse.json({ error: "Failed to compile digest" }, { status: 500 });
  }
}
