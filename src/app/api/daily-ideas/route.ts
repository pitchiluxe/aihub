import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";

// Server-side in-memory cache (one entry per UTC date)
const cache = new Map<string, { ideas: GeneratedIdea[]; ts: number }>();

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

const CATEGORIES = [
  "Healthcare", "Legal", "Education", "Finance", "Home Services",
  "Construction", "Food", "Agriculture", "HR", "Mental Health",
  "Real Estate", "Retail", "Web Design", "Government", "Logistics",
  "Automation", "Marketing", "Automotive", "Beauty & Wellness",
  "Insurance", "E-commerce", "Property Mgmt", "Accounting", "Non-profit", "Pet Care",
];

const SYSTEM_PROMPT = `You are a world-class startup idea generator specializing in AI-powered tools.
Generate exactly 15 unique, highly specific AI tool ideas for businesses and individuals.
Each idea must be genuinely world-changing, commercially viable, and buildable with today's AI tools.
Focus on real pain points — not generic ideas.

Return ONLY a valid JSON array (no markdown, no explanation) with exactly 15 objects. Each object:
{
  "id": "kebab-case-unique-id",
  "title": "Tool Name (5 words max)",
  "category": "one from: ${CATEGORIES.join(", ")}",
  "emoji": "single relevant emoji",
  "tagline": "one punchy line under 80 chars",
  "problem": "2-3 sentences describing the specific pain point with a dollar/stat anchor",
  "solution": "2-3 sentences — the AI-powered solution that eliminates the problem",
  "revenueModel": "specific pricing model with dollar amounts",
  "revenuePotential": "$XM–$YM ARR",
  "difficulty": "Easy" | "Medium" | "Hard",
  "timeToMVP": "X–Y weeks",
  "techStack": ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "whyNow": "1-2 sentences: why this is the right moment to build this"
}`;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractJson(raw: string): GeneratedIdea[] {
  // Strip markdown fences if present
  const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  // Find the outermost JSON array
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found in response");
  const parsed = JSON.parse(clean.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  return parsed.map((item, i) => ({
    ...item,
    id: item.id || `ai-idea-${i}-${Date.now()}`,
    isAiGenerated: true as const,
  }));
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayUTC();

  // Return cached result if same day
  const cached = cache.get(date);
  if (cached) {
    return NextResponse.json({ ideas: cached.ideas, date, cached: true });
  }

  try {
    const raw = await callModel(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Today is ${date}. Generate 15 completely fresh and unexpected AI tool ideas. Make them specific, creative, and genuinely useful. Avoid ideas that are commonly discussed — surprise me with original angles. Return only the JSON array.`,
        },
      ],
      4096,
    );

    const ideas = extractJson(raw);
    cache.set(date, { ideas, ts: Date.now() });

    // Evict old cache entries (keep only last 3 days)
    for (const [key] of cache) {
      if (key < date && cache.size > 3) cache.delete(key);
    }

    return NextResponse.json({ ideas, date, cached: false });
  } catch (err) {
    console.error("[daily-ideas] Generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate ideas. Using base set.", ideas: [], date },
      { status: 500 },
    );
  }
}
