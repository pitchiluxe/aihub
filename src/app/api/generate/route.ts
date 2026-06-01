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
        2000
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
