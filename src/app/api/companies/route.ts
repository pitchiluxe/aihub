export const revalidate = 3600; // cache 1 hour on Vercel

import { NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";

const SYSTEM_PROMPT = `You are an AI industry analyst with up-to-date knowledge of the AI landscape. Generate fresh intelligence on 8 major AI companies. Return ONLY valid JSON array, no markdown fences:
[
  {
    "id": "openai",
    "name": "OpenAI",
    "tagline": "One fresh sentence about what OpenAI is doing right now",
    "latestModel": "Most recent model name",
    "keyDevelopment": "One specific recent development or announcement",
    "valuation": "Latest estimated valuation",
    "momentum": "rising|stable|mixed",
    "focus": ["3-4 current focus areas as tags"]
  }
]

Generate for these companies in this order: openai, anthropic, google-deepmind, meta-ai, xai, mistral, deepseek, microsoft. Make the tagline and keyDevelopment genuinely fresh and specific — not generic filler. Keep valuation realistic.`;

export async function GET() {
  try {
    const raw = await callModel(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Generate fresh AI company intelligence for today." },
      ],
      1800,
    );

    // Extract JSON array, stripping markdown fences if present
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("No JSON array found in model response");
    }

    const parsed = JSON.parse(match[0]);

    return NextResponse.json({
      companies: parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/companies] Error:", err);
    return NextResponse.json(
      { companies: [], error: "Failed" },
      { status: 500 },
    );
  }
}
