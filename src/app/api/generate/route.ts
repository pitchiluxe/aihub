import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

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

const MODELS = [
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-31b-it:free",
  "moonshotai/kimi-k2.6:free",
  "qwen/qwen3-coder:free",
];

function buildHeaders(): Record<string, string> {
  const key = (process.env.ANTHROPIC_AUTH_TOKEN || process.env.OPENROUTER_API_KEY || "").replace(/[^\x00-\x7F]/g, "");
  const referer = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`,
    "HTTP-Referer": referer,
    "X-Title": "AIHub",
  };
}

// Skill/agent: stream SSE directly from OpenRouter to client so Vercel never times out
async function handleStreaming(
  systemPrompt: string,
  userMessage: string,
  type: string,
): Promise<Response> {
  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 900,
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!res.ok || !res.body) continue;

      // Peek at first chunk to detect error JSON vs SSE data
      const reader = res.body.getReader();
      const { done, value: firstChunk } = await reader.read();
      if (done || !firstChunk) continue;

      const firstText = new TextDecoder().decode(firstChunk);
      // OpenRouter error responses are plain JSON objects, not SSE lines
      if (firstText.trimStart().startsWith("{")) continue;

      // Good: pipe entire stream to client
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(firstChunk);
          function pump(): Promise<void> {
            return reader.read().then(({ done, value }) => {
              if (done) { controller.close(); return; }
              controller.enqueue(value);
              return pump();
            });
          }
          pump().catch(() => controller.close());
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Generate-Type": type,
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "All models failed or unavailable" }, { status: 503 });
}

export async function POST(req: NextRequest) {
  try {
    const { type, prompt } = await req.json();

    if (!prompt || !type) {
      return NextResponse.json({ error: "Missing required fields: type and prompt" }, { status: 400 });
    }

    let systemPrompt: string;
    if (type === "skill") systemPrompt = SKILL_GENERATION_PROMPT;
    else if (type === "prompt") systemPrompt = PROMPT_GENERATION_PROMPT;
    else if (type === "idea") systemPrompt = IDEA_GENERATION_PROMPT;
    else systemPrompt = AGENT_GENERATION_PROMPT;

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

    // All types use streaming — avoids Vercel timeout regardless of model response time
    return handleStreaming(systemPrompt, userMessage, type);
  } catch (error) {
    console.error("[Generate] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
