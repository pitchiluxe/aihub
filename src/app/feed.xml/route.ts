import { NextResponse } from "next/server";
import { fetchNewsFromRSS } from "@/lib/news";

export const revalidate = 300; // 5 minutes

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const articles = await fetchNewsFromRSS();
    const items = articles.slice(0, 50);

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>AIHub — AI News Feed</title>
    <link>${BASE}/news</link>
    <description>Breaking AI news from OpenAI, Anthropic, Google, Meta, Mistral, arXiv and more — curated by AIHub.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE}/icon-192.png</url>
      <title>AIHub</title>
      <link>${BASE}</link>
    </image>
${items.map((a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(a.url)}</link>
      <guid isPermaLink="true">${escapeXml(a.url)}</guid>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <source url="${escapeXml(a.url)}">${escapeXml(a.source)}</source>
      <description>${escapeXml(a.summary ?? a.title)}</description>
      <category>${escapeXml(a.category)}</category>
    </item>`).join("\n")}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return new NextResponse("Failed to generate feed", { status: 500 });
  }
}
