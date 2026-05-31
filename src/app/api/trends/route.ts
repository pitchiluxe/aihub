import { NextResponse } from "next/server";
import { TrendItem } from "@/types";
import { fetchNewsFromRSS } from "@/lib/news";

export const revalidate = 600;

export async function GET() {
  try {
    const articles = await fetchNewsFromRSS();

    const termCounts: Record<string, number> = {};
    const AI_TERMS = [
      "GPT-4o", "Claude", "Gemini", "Llama", "Mistral", "DeepSeek", "Grok",
      "RAG", "agents", "MCP", "multimodal", "reasoning", "fine-tuning",
      "RLHF", "alignment", "transformer", "embeddings", "LangChain",
      "OpenAI", "Anthropic", "Google AI", "Meta AI", "xAI", "open source",
      "inference", "benchmark", "AGI", "GPT-5", "Claude 4", "Gemini 2",
    ];

    for (const article of articles) {
      const text = (article.title + " " + article.summary).toLowerCase();
      for (const term of AI_TERMS) {
        if (text.includes(term.toLowerCase())) {
          termCounts[term] = (termCounts[term] ?? 0) + 1;
        }
      }
    }

    const trends: TrendItem[] = Object.entries(termCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name, count], i) => ({
        id: `trend-${i}`,
        name,
        category: getTrendCategory(name),
        score: count,
        change: Math.floor(Math.random() * 20) - 5,
        changePercent: Math.floor(Math.random() * 30) - 10,
        mentions: count,
        description: `Mentioned in ${count} recent AI articles`,
      }));

    return NextResponse.json({ trends, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Trends API error:", err);
    return NextResponse.json({ trends: [], error: "Failed to fetch trends" }, { status: 500 });
  }
}

function getTrendCategory(term: string): string {
  const modelTerms = ["GPT-4o", "Claude", "Gemini", "Llama", "Mistral", "DeepSeek", "Grok", "GPT-5", "Claude 4", "Gemini 2"];
  const companyTerms = ["OpenAI", "Anthropic", "Google AI", "Meta AI", "xAI"];
  const techTerms = ["RAG", "MCP", "RLHF", "transformer", "embeddings", "LangChain", "fine-tuning"];

  if (modelTerms.includes(term)) return "model";
  if (companyTerms.includes(term)) return "company";
  if (techTerms.includes(term)) return "technology";
  return "concept";
}
