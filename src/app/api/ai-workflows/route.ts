import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Content & Marketing", "Customer Support", "Sales & CRM", "DevOps & Engineering",
  "Data & Analytics", "HR & Recruiting", "Finance & Billing", "Social Media",
  "E-commerce", "Research & Intelligence", "Security & Compliance", "Product Management",
];

const TOOLS_POOL = [
  "OpenAI GPT-4", "Claude", "Gemini", "Slack", "Gmail", "Notion", "Airtable",
  "HubSpot", "Salesforce", "GitHub", "Jira", "Zapier", "n8n", "Make.com",
  "Stripe", "Shopify", "Twilio", "SendGrid", "Postgres", "Supabase",
  "Google Sheets", "Typeform", "Webflow", "Linear", "Intercom", "Zendesk",
  "Discord", "Twitter/X", "LinkedIn", "YouTube", "Pinecone", "LangChain",
  "Perplexity", "Firecrawl", "Puppeteer", "AWS Lambda", "Vercel",
];

const SYSTEM_PROMPT = `You are a world-class automation architect who designs creative, practical AI workflow automations.

Generate ${6} completely different, genuinely useful AI workflow automation ideas. Make them specific, novel, and immediately actionable — not generic.

Pick varied categories from: ${CATEGORIES.join(", ")}

Return ONLY a valid JSON array, no markdown fences:
[
  {
    "id": "wf-<random 6 char hex>",
    "title": "Specific descriptive workflow name",
    "description": "One sentence — what it automates and the business value",
    "category": "Category name",
    "difficulty": "simple|intermediate|complex",
    "tools": ["Tool1", "Tool2", "Tool3", "Tool4"],
    "steps": [
      { "type": "trigger", "label": "What starts the workflow", "tool": "ToolName" },
      { "type": "ai", "label": "What AI does here", "tool": "AI Model" },
      { "type": "action", "label": "What happens next", "tool": "ToolName" },
      { "type": "condition", "label": "Decision or filter", "tool": "Logic" },
      { "type": "output", "label": "Final result", "tool": "ToolName" }
    ],
    "estimatedTime": "X hours/days to build",
    "useCase": "Specific measurable benefit — e.g. saves 5 hours/week"
  }
]

Rules:
- Each workflow must be distinct — different industry, tools, and trigger
- Steps must form a logical automation chain (3-6 steps)
- Use real, commonly available tools
- Difficulty: simple=1-3 steps no branching, intermediate=4-5 steps with AI, complex=6+ steps multi-system
- useCase must be concrete and specific, not vague
- Focus on what's possible with AI + no-code tools TODAY`;

export async function GET(req: NextRequest) {
  // Allow caller to request a specific count (default 6, max 12)
  const count = Math.min(
    parseInt(new URL(req.url).searchParams.get("count") ?? "6", 10),
    12
  );

  try {
    const raw = await callModel(
      [
        { role: "system", content: SYSTEM_PROMPT.replace("${6}", String(count)) },
        {
          role: "user",
          content: `Generate ${count} fresh, creative AI workflow ideas right now. Make each one genuinely useful and different. Surprise me with novel combinations.`,
        },
      ],
      2000,
    );

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in response");

    const workflows = JSON.parse(match[0]);

    return NextResponse.json({
      workflows,
      generatedAt: new Date().toISOString(),
      count: workflows.length,
    });
  } catch (err) {
    console.error("[ai-workflows]", err);
    return NextResponse.json({ workflows: [], error: "Generation failed" }, { status: 500 });
  }
}
