import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  "prompt-engineering": { icon: "✍️", color: "#8b5cf6" },
  "agent-development":  { icon: "🤖", color: "#6366f1" },
  "rag":                { icon: "🔍", color: "#0ea5e9" },
  "mcp":                { icon: "🔌", color: "#10b981" },
  "ollama":             { icon: "🦙", color: "#f59e0b" },
  "openrouter":         { icon: "🌐", color: "#ec4899" },
  "fine-tuning":        { icon: "🎯", color: "#ef4444" },
  "langchain":          { icon: "⛓️", color: "#84cc16" },
  "ai-apps":            { icon: "📱", color: "#f97316" },
  "general":            { icon: "🧠", color: "#6366f1" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "general";
  const level = searchParams.get("level") ?? "all";
  const search = searchParams.get("q") ?? "";

  const meta = CATEGORY_META[category] ?? CATEGORY_META["general"];

  const levelFilter = level !== "all" ? ` at ${level} level` : " across beginner, intermediate, and advanced levels";
  const searchFilter = search ? ` related to "${search}"` : "";

  const prompt = `Generate 8 practical AI/ML tutorials on "${category}"${levelFilter}${searchFilter}.

Return ONLY a valid JSON array. Each tutorial must have this exact structure:
{
  "id": "unique-slug-id",
  "title": "Tutorial Title",
  "category": "${category}",
  "level": "beginner" | "intermediate" | "advanced" | "expert",
  "duration": <number in minutes>,
  "tags": ["tag1", "tag2", "tag3"],
  "description": "One sentence describing what the user will build or learn.",
  "icon": "${meta.icon}",
  "color": "${meta.color}",
  "steps": [
    {
      "title": "Step title",
      "explanation": "Clear 2-4 sentence explanation of what to do and why.",
      "code": "# Optional code example\ncode_here = True",
      "language": "python",
      "tip": "Optional pro tip or common mistake to avoid."
    }
  ]
}

Requirements:
- Each tutorial has 3-5 steps
- Steps have real, working code examples in Python, TypeScript, or bash
- Titles are specific and actionable (e.g., "Build a RAG pipeline with ChromaDB" not "Learn RAG")
- Cover a range of levels if level is "all"
- Focus on practical, hands-on learning
- Return ONLY the JSON array, no markdown fences, no extra text`;

  try {
    const raw = await callModel(
      [
        {
          role: "system",
          content: "You are an expert AI/ML educator. Generate structured tutorial content as valid JSON only. Return no markdown fences, no explanation — only the JSON array requested.",
        },
        { role: "user", content: prompt },
      ],
      4096,
      "meta-llama/llama-3.3-70b-instruct:free",
    );

    // Extract JSON from the response (handle cases where model adds markdown)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const tutorials = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(tutorials) || tutorials.length === 0) {
      throw new Error("Empty tutorial array");
    }

    // Normalize and validate each tutorial
    const normalized = tutorials.map((t: any, idx: number) => ({
      id: t.id ?? `tutorial-${category}-${idx}`,
      title: t.title ?? "Untitled Tutorial",
      category: t.category ?? category,
      level: ["beginner", "intermediate", "advanced", "expert"].includes(t.level) ? t.level : "intermediate",
      duration: typeof t.duration === "number" ? t.duration : 30,
      tags: Array.isArray(t.tags) ? t.tags.slice(0, 5) : [category],
      description: t.description ?? "",
      icon: t.icon ?? meta.icon,
      color: t.color ?? meta.color,
      steps: Array.isArray(t.steps) ? t.steps.map((s: any) => ({
        title: s.title ?? "Step",
        explanation: s.explanation ?? "",
        code: s.code,
        language: s.language ?? "python",
        tip: s.tip,
      })) : [],
    }));

    return NextResponse.json(
      { tutorials: normalized, category, generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    console.error("[/api/tutorials]", err);
    return NextResponse.json({ error: "Failed to generate tutorials", tutorials: [] }, { status: 500 });
  }
}
