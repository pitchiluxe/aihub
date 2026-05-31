import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProjectType = "chatbot" | "agent" | "rag" | "workflow" | "api" | "custom";
export type ProjectLanguage = "typescript" | "python" | "javascript";

export interface PlaygroundProject {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  language: ProjectLanguage;
  code: string;
  model: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
}

interface PlaygroundStore {
  projects: PlaygroundProject[];
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;
  saveProject: (project: Omit<PlaygroundProject, "id" | "createdAt" | "updatedAt">) => string;
  updateProject: (id: string, updates: Partial<PlaygroundProject>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => PlaygroundProject | undefined;
}

export const TEMPLATES: PlaygroundProject[] = [
  {
    id: "tpl-chatbot",
    name: "Simple AI Chatbot",
    description: "A minimal chatbot using OpenRouter with streaming responses",
    type: "chatbot",
    language: "typescript",
    isTemplate: true,
    model: "deepseek/deepseek-v3-base:free",
    tags: ["beginner", "chatbot", "OpenRouter"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    code: `// Simple AI Chatbot — OpenRouter Edition
// Paste in a Next.js API route or Node.js script

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "deepseek/deepseek-v3-base:free"; // Free!

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

async function chat(messages: Message[]): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${OPENROUTER_KEY}\`,
      "Content-Type": "application/json",
      "X-Title": "My AI Chatbot",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(\`API error: \${response.status}\`);

  const data = await response.json();
  return data.choices[0].message.content;
}

// Example usage:
const history: Message[] = [
  { role: "system", content: "You are a helpful AI assistant." }
];

async function sendMessage(userInput: string) {
  history.push({ role: "user", content: userInput });

  const reply = await chat(history);
  history.push({ role: "assistant", content: reply });

  console.log("AI:", reply);
  return reply;
}

// Test it:
sendMessage("What is the capital of France?");
`,
  },
  {
    id: "tpl-agent",
    name: "ReAct AI Agent",
    description: "An agent that can reason and use tools (search, calculator, weather)",
    type: "agent",
    language: "python",
    isTemplate: true,
    model: "deepseek/deepseek-v3-base:free",
    tags: ["intermediate", "agent", "tools", "ReAct"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    code: `# ReAct AI Agent — Reason + Act Pattern
# Install: pip install openai requests

import json
import requests
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="YOUR_OPENROUTER_KEY",  # Free models available!
)

# Define tools the agent can use
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Perform mathematical calculations",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression to evaluate"}
                },
                "required": ["expression"]
            }
        }
    }
]

def web_search(query: str) -> str:
    """Simulated web search — replace with real API"""
    return f"Search results for '{query}': [Latest AI news, model releases, research papers...]"

def calculator(expression: str) -> str:
    """Safe math evaluator"""
    try:
        result = eval(expression, {"__builtins__": {}})
        return str(result)
    except Exception as e:
        return f"Error: {e}"

def run_agent(user_query: str, max_steps: int = 5):
    """Run the ReAct agent loop"""
    messages = [
        {"role": "system", "content": """You are a helpful AI agent with tools.
Use tools when you need current information or calculations.
Think step-by-step before acting."""},
        {"role": "user", "content": user_query}
    ]

    for step in range(max_steps):
        response = client.chat.completions.create(
            model="deepseek/deepseek-v3-base:free",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto"
        )

        msg = response.choices[0].message
        messages.append(msg)

        # No tool calls = final answer
        if not msg.tool_calls:
            print(f"\\nFinal Answer: {msg.content}")
            return msg.content

        # Execute tool calls
        for tool_call in msg.tool_calls:
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)

            print(f"[Step {step+1}] Using tool: {func_name}({args})")

            if func_name == "web_search":
                result = web_search(args["query"])
            elif func_name == "calculator":
                result = calculator(args["expression"])
            else:
                result = "Tool not found"

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })

    return "Max steps reached"

# Test the agent
result = run_agent("What are the latest AI models released this week and how many is that times 3?")
`,
  },
  {
    id: "tpl-rag",
    name: "RAG System",
    description: "Build a document Q&A system with vector search and LLM",
    type: "rag",
    language: "python",
    isTemplate: true,
    model: "deepseek/deepseek-v3-base:free",
    tags: ["intermediate", "RAG", "embeddings", "vector"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    code: `# RAG System — Retrieval Augmented Generation
# Install: pip install openai chromadb numpy

import chromadb
from openai import OpenAI
import hashlib

# Setup clients
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="YOUR_OPENROUTER_KEY"
)

# In-memory vector store (use Chroma, Pinecone, or pgvector in production)
chroma = chromadb.Client()
collection = chroma.create_collection("knowledge_base")

def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Split text into overlapping chunks"""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - 50):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def embed_text(text: str) -> list[float]:
    """Get embeddings from OpenRouter (or use local model)"""
    # Using a simple hash-based fake embedding for demo
    # Replace with: client.embeddings.create(model="...", input=text)
    import hashlib
    hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
    return [(hash_val >> i) & 0xFF for i in range(384)]

def add_document(doc_id: str, text: str, metadata: dict = {}):
    """Add a document to the knowledge base"""
    chunks = chunk_text(text)

    for i, chunk in enumerate(chunks):
        embedding = embed_text(chunk)
        collection.add(
            ids=[f"{doc_id}_chunk_{i}"],
            embeddings=[embedding],
            documents=[chunk],
            metadatas=[{"doc_id": doc_id, "chunk": i, **metadata}]
        )

    print(f"Added {len(chunks)} chunks from document: {doc_id}")

def retrieve(query: str, top_k: int = 3) -> list[str]:
    """Find most relevant chunks for a query"""
    query_embedding = embed_text(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    return results["documents"][0]

def rag_query(question: str) -> str:
    """Answer a question using RAG"""
    # 1. Retrieve relevant context
    context_chunks = retrieve(question)
    context = "\\n\\n".join(context_chunks)

    # 2. Generate answer with context
    response = client.chat.completions.create(
        model="deepseek/deepseek-v3-base:free",
        messages=[
            {
                "role": "system",
                "content": """You are a helpful assistant that answers questions based on provided context.
Always cite which part of the context you used.
If the context doesn't contain the answer, say so clearly."""
            },
            {
                "role": "user",
                "content": f"""Context:
{context}

Question: {question}

Answer based on the context above:"""
            }
        ]
    )

    return response.choices[0].message.content

# Demo
AI_DOCS = """
Large Language Models (LLMs) are neural networks trained on vast amounts of text data.
They can generate human-like text, answer questions, write code, and more.

Key architectures:
- Transformer: The foundation of modern LLMs (Attention is All You Need, 2017)
- GPT: Generative Pre-trained Transformer by OpenAI
- BERT: Bidirectional Encoder Representations from Transformers by Google

Popular models in 2025:
- GPT-4o: OpenAI's multimodal flagship model
- Claude 3.5 Sonnet: Anthropic's best model for reasoning
- DeepSeek V3: Open source, free, competitive with GPT-4o
- Llama 3: Meta's open source model family

RAG (Retrieval Augmented Generation) combines vector search with LLMs
to answer questions about specific documents and data.
"""

add_document("ai_fundamentals", AI_DOCS, {"topic": "AI basics"})
answer = rag_query("What are the most popular AI models in 2025?")
print(f"Answer: {answer}")
`,
  },
  {
    id: "tpl-workflow",
    name: "AI Workflow Orchestrator",
    description: "Multi-step AI workflow with error handling and retries",
    type: "workflow",
    language: "typescript",
    isTemplate: true,
    model: "deepseek/deepseek-v3-base:free",
    tags: ["advanced", "workflow", "orchestration"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    code: `// AI Workflow Orchestrator
// Runs a series of AI steps with error handling

interface WorkflowStep {
  name: string;
  prompt: (input: string, context: Record<string, string>) => string;
  outputKey: string;
}

interface WorkflowResult {
  success: boolean;
  context: Record<string, string>;
  error?: string;
}

async function callAI(prompt: string, model = "deepseek/deepseek-v3-base:free"): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

async function runWorkflow(
  input: string,
  steps: WorkflowStep[],
  maxRetries = 2
): Promise<WorkflowResult> {
  const context: Record<string, string> = { input };

  for (const step of steps) {
    console.log(\`\\n⚡ Running step: \${step.name}\`);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const prompt = step.prompt(input, context);
        const output = await callAI(prompt);
        context[step.outputKey] = output;
        console.log(\`✅ \${step.name}: Done\`);
        break;
      } catch (err) {
        lastError = err as Error;
        console.log(\`⚠️ Attempt \${attempt + 1} failed: \${lastError.message}\`);
        if (attempt === maxRetries) {
          return { success: false, context, error: \`\${step.name}: \${lastError.message}\` };
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  return { success: true, context };
}

// Example: AI Blog Post Generator Workflow
const blogWorkflow: WorkflowStep[] = [
  {
    name: "Research",
    outputKey: "research",
    prompt: (topic) => \`Research the topic "\${topic}" and provide 5 key facts and recent developments. Be concise.\`,
  },
  {
    name: "Outline",
    outputKey: "outline",
    prompt: (topic, ctx) => \`Create a blog post outline for "\${topic}" using this research:
\${ctx.research}

Include: introduction, 3 main sections, conclusion.\`,
  },
  {
    name: "Draft",
    outputKey: "draft",
    prompt: (_, ctx) => \`Write a complete blog post following this outline:
\${ctx.outline}

Make it engaging, informative, and around 600 words.\`,
  },
  {
    name: "Polish",
    outputKey: "final",
    prompt: (_, ctx) => \`Edit and improve this blog post for clarity, flow, and engagement:
\${ctx.draft}

Fix any issues and make it publication-ready.\`,
  },
];

// Run it!
const result = await runWorkflow("The future of AI agents in 2025", blogWorkflow);

if (result.success) {
  console.log("\\n📝 Final Blog Post:");
  console.log(result.context.final);
} else {
  console.error("Workflow failed:", result.error);
}
`,
  },
];

export const usePlaygroundStore = create<PlaygroundStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      setActiveProject: (id) => set({ activeProjectId: id }),

      saveProject: (project) => {
        const id = `proj-${Date.now()}`;
        const now = new Date().toISOString();
        set((s) => ({
          projects: [
            { ...project, id, createdAt: now, updatedAt: now },
            ...s.projects,
          ],
          activeProjectId: id,
        }));
        return id;
      },

      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),

      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    { name: "aihub-playground" }
  )
);
