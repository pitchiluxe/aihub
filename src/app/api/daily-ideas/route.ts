import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";

export const maxDuration = 60; // Vercel Pro: up to 60 s per request

// Server-side cache keyed by `date-batch`
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

// 5 industry groups — each batch generates 20 ideas from its group
const BATCH_GROUPS: Record<number, string[]> = {
  0: ["Healthcare", "Mental Health", "Senior Care", "Dental", "Pharmacy"],
  1: ["Legal", "Government", "Insurance", "Finance", "Accounting"],
  2: ["Education", "HR", "Non-profit", "Community", "Training"],
  3: ["Home Services", "Construction", "Automotive", "Logistics", "Property Mgmt"],
  4: ["Automation", "Marketing", "E-commerce", "Retail", "Web Design",
      "Food", "Agriculture", "Beauty & Wellness", "Pet Care", "Real Estate"],
};

function systemPrompt(batch: number, date: string): string {
  const industries = BATCH_GROUPS[batch]?.join(", ") ?? "any industry";
  return `You are a world-class AI startup idea generator. Today is ${date}, batch ${batch + 1} of 5.
Generate exactly 20 unique, highly specific, commercially viable AI tool ideas focused on these industries: ${industries}.
Each idea must target a real, quantified pain point and propose a concrete AI-powered solution.
Avoid generic ideas — be specific, surprising, and creative.
Use a different angle for each idea within the same industry (don't repeat patterns).

Return ONLY a valid JSON array with exactly 20 objects. No markdown, no explanation, no text outside the array.
Each object must have:
{
  "id": "unique-kebab-case-id-with-${date}-${batch}",
  "title": "Concise Tool Name (max 6 words)",
  "category": "one of: ${industries}",
  "emoji": "one relevant emoji",
  "tagline": "one punchy, specific line under 85 characters",
  "problem": "2–3 sentences with a dollar or stat anchor describing the real pain",
  "solution": "2–3 sentences explaining exactly how AI solves it",
  "revenueModel": "specific pricing with dollar amounts (e.g. $49–$199/month SaaS)",
  "revenuePotential": "$XM–$YM ARR",
  "difficulty": "Easy" | "Medium" | "Hard",
  "timeToMVP": "X–Y weeks",
  "techStack": ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
  "whyNow": "1–2 sentences explaining why right now is the ideal moment to build this"
}`;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractJson(raw: string): GeneratedIdea[] {
  const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in response");
  const parsed = JSON.parse(clean.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  return parsed.map((item, i) => ({
    ...item,
    id: item.id ?? `ai-${Date.now()}-${i}`,
    isAiGenerated: true as const,
  }));
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? todayUTC();
  const batch = Number(req.nextUrl.searchParams.get("batch") ?? "0");

  const cacheKey = `${date}-${batch}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ ideas: cached, date, batch, cached: true });
  }

  try {
    const raw = await callModel(
      [
        { role: "system", content: systemPrompt(batch, date) },
        {
          role: "user",
          content: `Generate 20 completely fresh, unexpected AI tool ideas for batch ${batch + 1}. Be bold and specific. Return ONLY the JSON array.`,
        },
      ],
      5500,
    );

    const ideas = extractJson(raw);
    cache.set(cacheKey, ideas);

    // Evict entries older than 2 days
    for (const [key] of cache) {
      const keyDate = key.slice(0, 10);
      if (keyDate < date) cache.delete(key);
    }

    return NextResponse.json({ ideas, date, batch, cached: false });
  } catch (err) {
    console.error(`[daily-ideas] batch=${batch} failed:`, err);
    return NextResponse.json(
      { error: String(err), ideas: [], date, batch },
      { status: 500 },
    );
  }
}
