import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const { type, prompt } = await req.json();

    if (!prompt || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = type === "skill" ? SKILL_GENERATION_PROMPT : AGENT_GENERATION_PROMPT;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://aihub.vercel.app",
        "X-Title": "AIHub",
      },
      body: JSON.stringify({
        model: "openai/gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Please generate a ${type} based on this request: ${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to generate" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the generated content to extract name, description, and code
    const lines = content.split("\n");
    const name = lines[0].replace(/^#+\s*/, "").trim() || `Generated ${type}`;
    const description = lines.slice(1, 3).join(" ").slice(0, 200);
    
    return NextResponse.json({
      name,
      description,
      code: content,
      type,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
