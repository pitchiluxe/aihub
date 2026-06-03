import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";

export const maxDuration = 60;

const SKILL_GENERATION_PROMPT = `You are an expert at creating AI skills for the AIHub platform. 
Generate a complete SKILL.md file based on the user's request.

The skill should include:
1. Clear description of what the skill does
2. When to use it
3. Step-by-step instructions
4. Code examples if applicable
5. Best practices
6. Common pitfalls to avoid

Format the output as a valid markdown file that can be directly used as SKILL.md.
Start with a brief name for the skill, then the full markdown content.`;

const AGENT_GENERATION_PROMPT = `You are an expert at creating AI agents for the AIHub platform.
Generate a complete agent configuration based on the user's request.

The agent should include:
1. Clear purpose and capabilities
2. System prompt/instructions
3. Available tools and their descriptions
4. Example interactions
5. Configuration parameters
6. Best practices for using this agent

Format the output as a structured agent configuration with markdown documentation.
Start with the agent name, then the full configuration and documentation.`;

const IDEA_GENERATION_PROMPT = `You are a visionary product strategist and serial entrepreneur with deep AI expertise.

Generate ONE completely original, never-before-seen idea for a web app, SaaS, AI tool, developer tool, or software product.

The idea MUST be:
- Genuinely novel — not a clone, variation, or minor twist on existing products
- Technically feasible today using LLMs, embeddings, RAG, or AI agents
- Commercially viable with a clear path to revenue
- Solving a real, specific pain point that current tools miss entirely
- The kind of idea that makes builders say "why hasn't anyone built this yet?"

Return ONLY valid JSON — no markdown fences, no explanation, no extra text:
{
  "name": "Product name — 2-4 memorable words",
  "tagline": "One sentence under 12 words",
  "category": "Web App | SaaS | AI Tool | Developer Tool | Mobile App | Browser Extension | API",
  "problem": "The specific pain point in 2-3 concrete sentences. Be specific about who suffers and how.",
  "solution": "How AI makes this uniquely possible today in 2-3 sentences.",
  "features": [
    "Feature 1 — specific, concrete, differentiated from alternatives",
    "Feature 2 — specific, concrete, differentiated from alternatives",
    "Feature 3 — specific, concrete, differentiated from alternatives",
    "Feature 4 — specific, concrete, differentiated from alternatives",
    "Feature 5 — specific, concrete, differentiated from alternatives"
  ],
  "techStack": ["Next.js", "TypeScript", "OpenRouter", "Supabase", "pgvector"],
  "monetization": "Specific pricing model and revenue strategy",
  "uniqueAngle": "The single insight or technical approach that makes this impossible to replicate overnight",
  "promptForGenerator": "Build [name]: [detailed product brief — describe the app, all core features, UX flows, tech stack, API integrations, data model, and what makes it special. This should be a complete spec ready to give a senior developer.]"
}`;

const PROMPT_GENERATION_PROMPT = `You are a world-class prompt engineer. Your job is to craft highly effective, production-ready AI prompts.

Given a task description and optional parameters (role, context, output format, tone), generate an optimized prompt that:
1. Opens with a clear role/persona assignment
2. States the task with precision and zero ambiguity
3. Provides relevant context and constraints
4. Specifies the exact output format expected
5. Includes chain-of-thought or step-by-step instructions where beneficial
6. Adds guardrails to prevent hallucination or off-topic responses
7. Ends with a clear instruction to begin

Rules:
- Output ONLY the final prompt text — no preamble, no explanation, no meta-commentary
- Make it copy-paste ready for immediate use
- Optimize for the requested tone and format
- Use markdown formatting within the prompt where it improves clarity`;

export async function POST(req: NextRequest) {
  try {
    const { type, prompt } = await req.json();

    if (!prompt || !type) {
      return NextResponse.json(
        { error: "Missing required fields: type and prompt" },
        { status: 400 }
      );
    }

    let systemPrompt: string;
    if (type === "skill") systemPrompt = SKILL_GENERATION_PROMPT;
    else if (type === "prompt") systemPrompt = PROMPT_GENERATION_PROMPT;
    else if (type === "idea") systemPrompt = IDEA_GENERATION_PROMPT;
    else systemPrompt = AGENT_GENERATION_PROMPT;

    console.log(`[Generate] Creating ${type} from prompt: "${prompt.substring(0, 100)}..."`);

    try {
      let userMessage: string;
      if (type === "prompt") {
        try {
          const config = JSON.parse(prompt);
          userMessage = `Generate an optimized AI prompt for the following:
Task: ${config.task}
${config.role ? `Role/Persona: ${config.role}` : ""}
${config.context ? `Context: ${config.context}` : ""}
Output Format: ${config.format || "detailed paragraphs"}
Tone: ${config.tone || "professional"}`.trim();
        } catch {
          userMessage = `Generate an optimized AI prompt for: ${prompt}`;
        }
      } else if (type === "idea") {
        try {
          const config = JSON.parse(prompt);
          userMessage = `Generate a never-before-seen product idea with these preferences:
Category: ${config.category || "any"}
Domain/Niche: ${config.domain || "any — surprise me"}
Scale: ${config.scale || "Full Product"}

Make it truly original. Think deeply before responding.`;
        } catch {
          userMessage = `Generate a never-before-seen original product idea. Be bold and original.`;
        }
      } else {
        userMessage = `Please generate a ${type} based on this request: ${prompt}`;
      }

      const content = await callModel(
        [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        3000,
        "openai/gpt-oss-120b:free",
      );

      // Parse the generated content to extract name, description, and code
      let name: string;
      let description: string;
      if (type === "prompt") {
        try {
          const config = JSON.parse(prompt);
          name = `Prompt: ${config.task.slice(0, 50)}`;
        } catch {
          name = "Generated Prompt";
        }
        description = "AI-optimized prompt ready for immediate use";
      } else if (type === "idea") {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          name = parsed?.name ?? "Original Idea";
          description = parsed?.tagline ?? "A never-before-seen product concept";
        } catch {
          name = "Generated Idea";
          description = "A never-before-seen product concept";
        }
      } else {
        const lines = content.split("\n");
        name = lines[0].replace(/^#+\s*/, "").trim() || `Generated ${type}`;
        description = lines.slice(1, 3).join(" ").slice(0, 200);
      }

      console.log(`[Generate] Success: ${name}`);

      // Automatically archive the generated item
      const archiveRes = await fetch(new URL("/api/archive", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          code: content,
          type,
        }),
      });

      let archiveData = null;
      if (archiveRes.ok) {
        archiveData = await archiveRes.json();
        console.log(`[Generate] Auto-archived as: ${archiveData.id}`);
      } else {
        console.warn("[Generate] Auto-archive failed, but generation succeeded");
      }

      return NextResponse.json({
        name,
        description,
        code: content,
        type,
        archivedId: archiveData?.id,
        shareUrl: archiveData?.shareUrl,
      });
    } catch (error) {
      console.error(`[Generate] Model error: ${error}`);
      return NextResponse.json(
        { error: `Failed to generate ${type}. Please try again in a moment.` },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("[Generate] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
