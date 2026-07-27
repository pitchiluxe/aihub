import { NextRequest, NextResponse } from "next/server";
import { callModel, DEFAULT_MODEL, QuotaExceededError } from "@/lib/ai/client";

// Free models take 5-90s each and callModel walks a fallback chain, so the old
// 55s budget cut generation off mid-chain and returned an empty ideas array.
export const maxDuration = 300;

const cache = new Map<string, GeneratedIdea[]>();

export interface GeneratedIdea {
  id: string;
  title: string;
  category: string;
  emoji: string;
  tagline: string;
  problem: string;
  solution: string;
  revenueModel: string;
  revenuePotential: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeToMVP: string;
  techStack: string[];
  features: string[];
  whyNow: string;
  isAiGenerated: true;
}

// 5 industry groups — 10 ideas each = 50 fresh ideas per day
// Rotates daily so the full topic space is covered over a week
const BATCH_GROUPS: Record<number, string[]> = {
  0: ["Healthcare", "Mental Health", "FinTech", "Accounting", "Insurance"],
  1: ["Networking", "Cloud Engineering", "Cybersecurity", "DevOps", "AI Infrastructure"],
  2: ["Travel", "Cheap Flight Hacking", "Hotel Arbitrage", "Points Optimization", "Digital Nomad Tools"],
  3: ["Trading", "Gold Trading Strategy", "Prop Trading", "Algorithmic Finance", "NASDAQ Intelligence"],
  4: ["Education", "E-commerce", "Logistics", "Real Estate", "Automation"],
};

// Was pinned to Llama 3.3 70B, whose free tier OpenRouter retired — it now
// 404s, so every request burned the whole fallback chain before producing
// anything. Track the shared registry instead of hardcoding an id here.
const IDEAS_MODEL = DEFAULT_MODEL;

function systemPrompt(batch: number, date: string): string {
  const industries = BATCH_GROUPS[batch]?.join(", ") ?? "any industry";
  const domainHints: Record<number, string> = {
    1: "Focus on specific networking protocols (BGP, SD-WAN, zero-trust), cloud cost engineering, and infrastructure automation. Be technically precise.",
    2: "Focus on flight price hacking, error fare detection, points/miles optimization, and travel arbitrage. Include real data sources (Amadeus, Duffel, GDS systems).",
    3: "Focus on real, actionable trading tools: ICT/Smart Money Concepts, prop firm challenge coaching, institutional order flow, gold-DXY correlation, FOMC event trading. Include specific financial APIs and accurate market mechanics.",
  };
  const hint = domainHints[batch] ? `\n\nDomain guidance: ${domainHints[batch]}` : "";

  return `You are an AI startup idea generator. Date: ${date}, batch ${batch + 1}/5.
Generate exactly 5 unique, commercially viable AI tool ideas for: ${industries}.${hint}

Return ONLY a valid JSON array. No markdown, no explanation, nothing else.

Each object:
{"id":"kebab-id-${date}-b${batch}-N","title":"Name (max 6 words)","category":"Industry","emoji":"emoji","tagline":"one-liner under 70 chars","problem":"1 sentence with specific $ pain point","solution":"1 sentence how AI solves it","revenueModel":"$XX-$XXX/month SaaS","revenuePotential":"$XM-$YM ARR","difficulty":"Medium","timeToMVP":"X-Y weeks","techStack":["Tech1","Tech2","Tech3","Tech4"],"features":["Feature1","Feature2","Feature3","Feature4","Feature5"],"whyNow":"why build this now"}

Rules: difficulty = "Easy"|"Medium"|"Hard". Return array of exactly 5 objects, nothing else.`;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractIdeas(raw: string): GeneratedIdea[] {
  // Strip markdown fences
  const clean = raw
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = clean.indexOf("[");
  const end   = clean.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");

  let jsonStr = clean.slice(start, end + 1);

  // Fix common model mistakes: trailing commas
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // A truncated response leaves a half-written object at the tail. Salvage
    // the complete ones rather than discarding the whole batch.
    const lastComplete = jsonStr.lastIndexOf("},");
    if (lastComplete === -1) throw new Error("No complete idea objects found");
    parsed = JSON.parse(`${jsonStr.slice(0, lastComplete + 1)}]`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty array");

  return parsed
    .filter((item: any) => item?.title && item?.id)
    .map((item: any, i: number): GeneratedIdea => ({
      id:              item.id              ?? `ai-idea-${Date.now()}-${i}`,
      title:           item.title           ?? "Untitled Idea",
      category:        item.category        ?? "General",
      emoji:           item.emoji           ?? "💡",
      tagline:         item.tagline         ?? "",
      problem:         item.problem         ?? "",
      solution:        item.solution        ?? "",
      revenueModel:    item.revenueModel    ?? "",
      revenuePotential:item.revenuePotential ?? "$1M+ ARR",
      difficulty:      ["Easy","Medium","Hard"].includes(item.difficulty) ? item.difficulty : "Medium",
      timeToMVP:       item.timeToMVP       ?? "4-6 weeks",
      techStack:       Array.isArray(item.techStack)  ? item.techStack  : ["Next.js","OpenAI","Supabase"],
      features:        Array.isArray(item.features)   ? item.features   : [],
      whyNow:          item.whyNow          ?? "",
      isAiGenerated:   true,
    }));
}

export async function GET(req: NextRequest) {
  const date  = req.nextUrl.searchParams.get("date")  ?? todayUTC();
  const batch = Number(req.nextUrl.searchParams.get("batch") ?? "0");

  const cacheKey = `${date}-${batch}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json({ ideas: cached, date, batch, cached: true });

  try {
    const raw = await callModel(
      [
        { role: "system", content: systemPrompt(batch, date) },
        {
          role: "user",
          content: `Generate 5 AI tool ideas for batch ${batch + 1}. JSON array only.`,
        },
      ],
      // 5 ideas x ~14 JSON fields needs real headroom; 1500 truncated the
      // array mid-object and extractIdeas threw on the partial JSON.
      4000,
      IDEAS_MODEL,
      0.4,
      75_000, // per-model ceiling; callModel falls through to the next model
    );

    const ideas = extractIdeas(raw);

    cache.set(cacheKey, ideas);

    // Evict cache entries older than 2 days
    for (const [key] of cache) {
      if (key.slice(0, 10) < date) cache.delete(key);
    }

    return NextResponse.json({ ideas, date, batch, cached: false });
  } catch (err) {
    console.error(`[daily-ideas] batch=${batch} error:`, String(err));
    // A quota wall is not a server fault, and the client should not keep
    // retrying it — 429 says "stop and tell the user", 500 says "try again".
    const quota = err instanceof QuotaExceededError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), ideas: [], date, batch },
      { status: quota ? 429 : 500 },
    );
  }
}
