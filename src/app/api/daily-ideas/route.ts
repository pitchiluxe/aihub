import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";

export const maxDuration = 60;

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
const BATCH_GROUPS: Record<number, string[]> = {
  0: ["Healthcare", "Mental Health", "Dental", "Pharmacy", "Senior Care"],
  1: ["Legal", "Finance", "Insurance", "Accounting", "Government"],
  2: ["Education", "HR", "Non-profit", "Training", "Community"],
  3: ["Home Services", "Construction", "Automotive", "Logistics", "Real Estate"],
  4: ["Marketing", "E-commerce", "Retail", "Food", "Beauty & Wellness"],
};

// Reliable model for structured JSON output
const IDEAS_MODEL = "google/gemma-4-31b-it:free";

function systemPrompt(batch: number, date: string): string {
  const industries = BATCH_GROUPS[batch]?.join(", ") ?? "any industry";
  return `You are an expert AI startup idea generator. Date: ${date}, batch ${batch + 1}/5.
Generate exactly 10 unique, highly specific, commercially viable AI tool ideas for: ${industries}.

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanation, nothing else.

Each object must follow this exact structure:
{
  "id": "kebab-case-id-${date}-b${batch}-N",
  "title": "Tool Name (max 6 words)",
  "category": "Industry name from the list",
  "emoji": "one emoji",
  "tagline": "punchy one-liner under 80 chars",
  "problem": "2 sentences with a real dollar or stat pain point",
  "solution": "2 sentences on exactly how AI solves it",
  "revenueModel": "$XX-$XXX/month SaaS or specific pricing",
  "revenuePotential": "$XM-$YM ARR",
  "difficulty": "Easy",
  "timeToMVP": "X-Y weeks",
  "techStack": ["Next.js", "OpenAI", "Supabase", "Stripe", "Tailwind"],
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "whyNow": "1 sentence on why this moment is perfect"
}

Rules:
- difficulty must be exactly "Easy", "Medium", or "Hard"
- techStack must be an array of 4-6 strings
- features must be an array of exactly 5 strings
- Be specific and creative — no generic ideas
- Return a JSON array of exactly 10 objects`;
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

  const parsed = JSON.parse(jsonStr);
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
          content: `Generate 10 fresh, creative, specific AI tool ideas for batch ${batch + 1}. Return ONLY the JSON array, nothing else.`,
        },
      ],
      3500,
      IDEAS_MODEL,
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
    return NextResponse.json(
      { error: String(err), ideas: [], date, batch },
      { status: 500 },
    );
  }
}
