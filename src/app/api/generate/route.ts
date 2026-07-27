import { NextRequest, NextResponse } from "next/server";
import { FALLBACK_CHAIN } from "@/lib/ai/models";
import { sanitizeContent, isDegenerate, looksLikeReasoning, extractJson } from "@/lib/ai/client";
import { generateWithOllama } from "@/lib/ai/ollama";
import { buildCandidates } from "@/lib/ai/catalog";

// Node runtime + Fluid Compute: free models take 5-90s, well past the old
// 30s edge budget. Chain is latency-ordered so the happy path returns in ~6s.
export const runtime = "nodejs";
export const maxDuration = 300;

const PER_MODEL_TIMEOUT_MS = 75_000;
const GLOBAL_DEADLINE_MS = 240_000;

// OpenRouter caps free-tier accounts at 50 free-model requests per day (1000
// once the account holds credit). That cap is account-wide, so when it trips
// every model in the chain 429s identically and no amount of falling back
// helps — the user needs to be told that, not shown ten stack traces.
const QUOTA_MARKER = "free-models-per-day";
const QUOTA_MESSAGE =
  "Daily free-model limit reached on this OpenRouter account. It resets at 00:00 UTC — or add $10 of credit at openrouter.ai/settings/credits to raise the cap to 1000 requests/day.";

class QuotaExceededError extends Error {
  constructor() {
    super(QUOTA_MESSAGE);
    this.name = "QuotaExceededError";
  }
}

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
Start with a brief name for the skill, then the full markdown content.
Output ONLY the markdown file. No preamble, no commentary, no reasoning.`;

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
Start with the agent name, then the full configuration and documentation.
Output ONLY the markdown file. No preamble, no commentary, no reasoning.`;

const IDEA_GENERATION_PROMPT = `You are a visionary product strategist and serial entrepreneur with deep AI expertise.

Generate ONE completely original, never-before-seen idea for a web app, SaaS, AI tool, developer tool, or software product.

The idea MUST be:
- Genuinely novel — not a clone, variation, or minor twist on existing products
- Technically feasible today using LLMs, embeddings, RAG, or AI agents
- Commercially viable with a clear path to revenue
- Solving a real, specific pain point that current tools miss entirely
- The kind of idea that makes builders say "why hasn't anyone built this yet?"

Output rules — follow exactly:
- Respond with a single JSON object and NOTHING else
- Do not write any reasoning, planning, or commentary before or after the JSON
- Do not wrap the JSON in markdown code fences
- Start your response with { and end it with }

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
  "targetUser": "The specific person who buys this — role, company size, daily workflow",
  "dataModel": "The core entities and how they relate, in one or two sentences",
  "promptForGenerator": "A complete product brief a senior developer could build from without asking a single question."
}`;

const PROMPT_GENERATION_PROMPT = `You are a world-class prompt engineer. Your job is to craft highly effective, production-ready AI prompts that direct an AI to immediately BUILD, CREATE, or WRITE the actual deliverable — not plan it.

Given a task description and optional parameters (role, context, output format, tone), generate an optimized prompt that:
1. Opens with a clear role/persona assignment
2. States the task with precision and zero ambiguity — uses action verbs: BUILD, CREATE, WRITE, IMPLEMENT, GENERATE
3. Provides relevant context and constraints
4. Specifies the exact output format expected
5. Includes step-by-step execution instructions where beneficial
6. Adds guardrails to prevent hallucination or off-topic responses
7. Ends with a clear instruction to START IMMEDIATELY and produce the real output

CRITICAL RULES:
- Output ONLY the final prompt text — no preamble, no explanation, no meta-commentary, no reasoning
- Make it copy-paste ready for immediate use
- NEVER use "outline", "plan", "describe how to", "provide a structure for", "draft an approach", or "summarize" — always direct the AI to produce the actual deliverable
- For coding tasks: the prompt must instruct the AI to write real, working code — not pseudocode or structure descriptions
- For content tasks: the prompt must instruct the AI to write the full content — not an outline or bullet points
- For app/website tasks: the prompt must instruct the AI to generate complete, functional implementation
- Optimize for the requested tone and format
- Use markdown formatting within the prompt where it improves clarity`;

// The centrepiece: turns a product idea into a master prompt that an AI coding
// agent (Claude Code, Cursor, ChatGPT) can act on immediately to start writing
// the real application — not a JSON file, not a plan, not a summary.
const BUILD_PROMPT_GENERATION_PROMPT = `You are the world's best technical product architect and prompt engineer.

You will be given a product idea. Your ONLY job is to write a single, complete, copy-paste-ready MASTER BUILD PROMPT that a developer will paste directly into Claude, ChatGPT, Claude Code, or Cursor. The moment they paste it, that AI must start writing real, working application code — file by file.

You are NOT writing a summary. You are NOT writing a plan for a plan. You are NOT producing JSON. You are writing the actual instruction text that commands an AI to build the app.

The master build prompt you produce MUST contain all of these sections, written as instructions addressed to the AI that will build the app:

# ROLE
Assign the builder AI a senior full-stack engineer persona with the exact expertise this product needs.

# PRODUCT
Name, one-line pitch, the specific user, and the exact problem being solved.

# TECH STACK
Every technology with versions where it matters — framework, language, styling, database, auth, AI provider, hosting. State it as non-negotiable.

# FEATURES TO BUILD
Every feature spelled out as a concrete, implementable requirement. For each: what the user does, what the system does in response, and what appears on screen. No vague verbs.

# DATA MODEL
Every table/collection with fields, types, and relationships. Written so it can be turned into a schema without guessing.

# API / SERVER ROUTES
Every endpoint: method, path, request shape, response shape, and what it does.

# UI / UX SPECIFICATION
Every page and route, the component tree for each, layout, navigation, empty states, loading states, and error states. Specify the visual style concretely — colour direction, typography, spacing, motion.

# FILE STRUCTURE
The full directory tree the AI should create, with a one-line purpose per file.

# BUILD ORDER
Numbered phases. Each phase names the exact files to write in that phase and ends in something runnable.

# ACCEPTANCE CRITERIA
A checklist that defines done. Each item objectively verifiable.

# START NOW
A final, explicit command: begin with Phase 1, write complete production-ready code for every file, no placeholders, no TODOs, no "implementation left as an exercise", no pseudocode. If a decision is ambiguous, make the sensible choice and state it in a comment, then keep building.

ABSOLUTE RULES:
- Output ONLY the master build prompt itself, as markdown. Nothing before it, nothing after it.
- Never output JSON. Never output a JSON schema. Never say "create a JSON file". The deliverable is a working application, not a data file.
- Never write reasoning, planning notes, or commentary about what you are doing.
- Never use the words "outline", "high-level overview", "you could", "consider", or "this is a starting point".
- Write in the imperative, addressed to the builder AI: "Build...", "Create the file...", "Implement...".
- Be exhaustive. Length is a feature here — a developer must be able to paste this and get a real app with zero follow-up questions.`;

const CLAUDEMD_GENERATION_PROMPT = `You are an expert at creating CLAUDE.md project instruction files for Claude Code — Anthropic's AI coding assistant CLI.

CLAUDE.md is placed at the root of a project and gives Claude Code persistent, authoritative context about the codebase before every task.

Generate a complete, production-quality CLAUDE.md based on the user's project description.

The file MUST include all of these sections:
## Project Overview
- What the project is, its mission, who uses it
## Tech Stack
- Every key technology, framework, language, database, deployment target
## Development Commands
- Exact commands for: dev server, build, test, lint, typecheck, deploy (in code blocks)
## Architecture
- Key directories and what lives in each (e.g. src/app, src/components, src/lib)
- Important files and their roles
## Coding Conventions
- Naming conventions (files, components, functions, variables)
- Import order, file structure patterns
- State management approach
- Error handling style
## Key Rules for Claude
- What Claude MUST always do in this project
- What Claude must NEVER do (no broad rewrites, no removing comments, etc.)
- Preferred patterns and anti-patterns
## Common Tasks
- How to add a new page/route
- How to add a new component
- How to add an API endpoint
- How to run migrations or seed data

Rules:
- Output ONLY the raw CLAUDE.md markdown — no preamble, no explanation, no reasoning, no code fences around the whole file
- Use ## headers, bullet points, and inline code blocks for commands
- Be specific and actionable — Claude Code reads this before every single task
- Write for an AI assistant, not a human developer — be explicit about intent, not just mechanics
- If tech stack / commands are provided, use them exactly; otherwise infer sensible defaults from context`;

type GenerateType = "skill" | "agent" | "prompt" | "buildprompt" | "idea" | "claudemd";

interface TypeConfig {
  system: string;
  maxTokens: number;
  temperature: number;
  validate: (content: string) => boolean;
}

/**
 * Markdown artifacts must be substantial prose, never a JSON blob — and never a
 * chain-of-thought. A response that is *entirely* reasoning has no artifact for
 * sanitizeContent to cut down to, so it is long and non-degenerate yet useless;
 * rejecting it here is what moves us on to the next model.
 */
function validMarkdown(min: number) {
  return (c: string) =>
    c.length >= min &&
    !c.trimStart().startsWith("{") &&
    !isDegenerate(c) &&
    !looksLikeReasoning(c);
}

/** The idea payload is only usable if it parses and carries the fields the UI renders. */
function validIdea(content: string): boolean {
  try {
    const parsed = JSON.parse(extractJson(content));
    return Boolean(
      parsed?.name &&
      parsed?.tagline &&
      parsed?.problem &&
      parsed?.solution &&
      Array.isArray(parsed?.features) &&
      parsed.features.length >= 3 &&
      parsed?.promptForGenerator,
    );
  } catch {
    return false;
  }
}

const TYPE_CONFIG: Record<GenerateType, TypeConfig> = {
  // Ideas need headroom: reasoning models spend tokens before the JSON starts,
  // and the old 900 cap truncated output mid-object on every single model.
  idea:        { system: IDEA_GENERATION_PROMPT,          maxTokens: 4000, temperature: 0.95, validate: validIdea },
  // Build prompts are intentionally long — this is the paste-into-Claude artifact.
  buildprompt: { system: BUILD_PROMPT_GENERATION_PROMPT,  maxTokens: 8000, temperature: 0.6,  validate: validMarkdown(1200) },
  prompt:      { system: PROMPT_GENERATION_PROMPT,        maxTokens: 4000, temperature: 0.7,  validate: validMarkdown(300) },
  skill:       { system: SKILL_GENERATION_PROMPT,         maxTokens: 4000, temperature: 0.7,  validate: validMarkdown(400) },
  agent:       { system: AGENT_GENERATION_PROMPT,         maxTokens: 4000, temperature: 0.7,  validate: validMarkdown(400) },
  claudemd:    { system: CLAUDEMD_GENERATION_PROMPT,      maxTokens: 6000, temperature: 0.6,  validate: validMarkdown(600) },
};

/** Mirrors src/lib/ai/client.ts so both callers honour the same override. */
function completionsBase(): string {
  const raw =
    process.env.OPENROUTER_BASE_URL ||
    process.env.ANTHROPIC_BASE_URL ||
    "https://openrouter.ai/api";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function completionsUrl(): string {
  return `${completionsBase()}/chat/completions`;
}

function buildHeaders(): Record<string, string> {
  const key = (process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || "").replace(/[^\x00-\x7F]/g, "");
  const referer = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`,
    "HTTP-Referer": referer,
    "X-Title": "AIHub",
  };
}

/**
 * Collect one model's full completion.
 *
 * We stream from OpenRouter (so slow free models never hit an idle timeout)
 * but buffer server-side rather than piping straight through. Piping made
 * fallback impossible: once response headers were sent, a model that returned
 * garbage or nothing could not be swapped out, which is how raw reasoning text
 * and empty results reached the UI.
 */
async function collectFromModel(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_MODEL_TIMEOUT_MS);

  try {
    const res = await fetch(completionsUrl(), {
      method: "POST",
      headers: buildHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        stream: true,
        temperature,
        // Without this the reasoning trace consumes the token budget and, on
        // some providers, is duplicated into delta.content.
        reasoning: { exclude: true },
        include_reasoning: false,
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => `HTTP ${res.status}`);
      if (res.status === 429 && detail.includes(QUOTA_MARKER)) throw new QuotaExceededError();
      throw new Error(`${res.status}: ${detail.slice(0, 160)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) throw new Error(parsed.error.message ?? "stream error");
          // delta.reasoning is deliberately ignored — it is never the artifact.
          content += parsed.choices?.[0]?.delta?.content ?? "";
        } catch {
          /* partial SSE frame — the next read completes it */
        }
      }
    }

    return sanitizeContent(content);
  } finally {
    clearTimeout(timer);
  }
}

/** Walk the latency-ordered chain until a model returns content that validates. */
async function generate(type: GenerateType, user: string): Promise<string> {
  const { system, maxTokens, temperature, validate } = TYPE_CONFIG[type];
  const startedAt = Date.now();
  const attempts: string[] = [];

  let quotaHit = false;

  // Local first — see callModel() for why. Every artifact here is validated
  // per type, so a small local model that fumbles the format simply falls
  // through to the cloud rather than shipping a bad result.
  const tryLocal = async (): Promise<string | null> => {
    const local = await generateWithOllama(system, user, maxTokens, temperature, validate);
    if (!local) return null;
    console.log(`[Generate] ${type} served locally by ${local.model}`);
    return local.content;
  };

  const tryCloud = async (): Promise<string | null> => {
    // Live catalogue, so retired models drop out instead of costing a round trip.
    const candidates = await buildCandidates(completionsBase(), process.env.ANTHROPIC_MODEL);
    for (const model of candidates.length ? candidates : FALLBACK_CHAIN) {
      if (Date.now() - startedAt > GLOBAL_DEADLINE_MS) break;
      try {
        const content = await collectFromModel(model, system, user, maxTokens, temperature);
        if (!content) throw new Error("empty content");
        if (!validate(content)) throw new Error(`failed ${type} validation (${content.length} chars)`);
        console.log(`[Generate] ${type} OK via ${model} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
        return content;
      } catch (err) {
        // The daily cap is account-wide — every remaining hosted model will
        // 429 too, so stop rather than burning the rest of the chain.
        if (err instanceof QuotaExceededError) {
          quotaHit = true;
          return null;
        }
        const msg = err instanceof Error ? err.message : String(err);
        attempts.push(`${model}: ${msg}`);
        console.warn(`[Generate] ${type} — ${model} rejected (${msg})`);
      }
    }
    return null;
  };

  for (const attempt of [tryLocal, tryCloud]) {
    const content = await attempt();
    if (content) return content;
  }

  if (quotaHit) throw new QuotaExceededError();
  throw new Error(`All models failed for ${type}. ${attempts.join(" | ")}`);
}

/**
 * Re-emit the finished artifact in OpenRouter's SSE shape.
 * The client already parses `choices[0].delta.content`, so keeping the wire
 * format means the generator page needs no special-casing per type.
 */
function sseResponse(content: string, type: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Chunked so very long build prompts render progressively.
      const CHUNK = 512;
      for (let i = 0; i < content.length; i += CHUNK) {
        const frame = { choices: [{ delta: { content: content.slice(i, i + CHUNK) } }] };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Generate-Type": type,
    },
  });
}

function userMessageFor(type: GenerateType, prompt: string): string {
  const parse = (): Record<string, string> | null => {
    try {
      const v = JSON.parse(prompt);
      return v && typeof v === "object" ? v : null;
    } catch {
      return null;
    }
  };

  if (type === "prompt") {
    const c = parse();
    if (!c) return `Generate an optimized AI prompt for: ${prompt}`;
    return [
      "Generate an optimized AI prompt for the following:",
      `Task: ${c.task}`,
      c.role ? `Role/Persona: ${c.role}` : "",
      c.context ? `Context: ${c.context}` : "",
      `Output Format: ${c.format || "detailed paragraphs"}`,
      `Tone: ${c.tone || "professional"}`,
    ].filter(Boolean).join("\n");
  }

  if (type === "buildprompt") {
    const idea = parse();
    if (!idea) return `Write the master build prompt for this product: ${prompt}`;
    // The whole idea object travels here so the build prompt inherits the real
    // features, stack, data model and angle — not just a one-line summary.
    return [
      "Write the MASTER BUILD PROMPT for this product idea.",
      "",
      `Product name: ${idea.name}`,
      `Tagline: ${idea.tagline}`,
      `Category: ${idea.category}`,
      `Target user: ${idea.targetUser || "inferred from the problem below"}`,
      `Problem: ${idea.problem}`,
      `Solution: ${idea.solution}`,
      `Features: ${Array.isArray(idea.features) ? (idea.features as unknown as string[]).join("; ") : idea.features}`,
      `Tech stack: ${Array.isArray(idea.techStack) ? (idea.techStack as unknown as string[]).join(", ") : idea.techStack}`,
      `Data model hint: ${idea.dataModel || "design a sensible one"}`,
      `Monetization: ${idea.monetization}`,
      `Unique angle: ${idea.uniqueAngle}`,
      `Original brief: ${idea.promptForGenerator || ""}`,
      "",
      "Produce the complete master build prompt now. Markdown only. No JSON.",
    ].join("\n");
  }

  if (type === "idea") {
    const c = parse();
    if (!c) return "Generate a never-before-seen original product idea. Be bold and original. JSON object only.";
    return [
      "Generate a never-before-seen product idea with these preferences:",
      `Category: ${c.category || "any"}`,
      `Domain/Niche: ${c.domain || "any — surprise me"}`,
      `Scale: ${c.scale || "Full Product"}`,
      // Free models are heavily biased toward the same handful of concepts;
      // a per-request seed measurably widens the output distribution.
      `Novelty seed: ${Math.random().toString(36).slice(2, 10)} (use this to avoid repeating common ideas)`,
      "",
      "Respond with the JSON object only.",
    ].join("\n");
  }

  if (type === "claudemd") {
    const c = parse();
    if (!c) return `Generate a complete CLAUDE.md for this project: ${prompt}`;
    return [
      "Generate a complete CLAUDE.md for the following project:",
      `Project Description: ${c.description}`,
      c.stack ? `Tech Stack: ${c.stack}` : "",
      c.commands ? `Key Commands: ${c.commands}` : "",
      c.conventions ? `Conventions / Preferences: ${c.conventions}` : "",
      "",
      "Make it comprehensive, specific, and immediately useful for Claude Code.",
    ].filter(Boolean).join("\n");
  }

  return `Please generate a ${type} based on this request: ${prompt}`;
}

export async function POST(req: NextRequest) {
  try {
    const { type, prompt } = await req.json();

    if (!prompt || !type) {
      return NextResponse.json({ error: "Missing required fields: type and prompt" }, { status: 400 });
    }
    if (!(type in TYPE_CONFIG)) {
      return NextResponse.json({ error: `Unknown generate type: ${type}` }, { status: 400 });
    }

    const t = type as GenerateType;
    const content = await generate(t, userMessageFor(t, prompt));
    return sseResponse(content, t);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[Generate] Failed:", message);
    // 429 tells the client this is a quota wall, not a broken generator.
    const status = error instanceof QuotaExceededError ? 429 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
