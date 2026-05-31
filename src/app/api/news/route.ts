import { NextRequest, NextResponse } from "next/server";
import { fetchNewsFromRSS } from "@/lib/news";

export const revalidate = 300; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? "all";
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const articles = await fetchNewsFromRSS();

    const filtered =
      category === "all" ? articles : articles.filter((a) => a.category === category);

    return NextResponse.json({
      articles: filtered.slice(0, limit),
      total: filtered.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json({ articles: [], total: 0, error: "Failed to fetch news" }, { status: 500 });
  }
}
