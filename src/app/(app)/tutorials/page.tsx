"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap, Clock, BookOpen, Play, Code, Bot, Zap,
  Search, Brain, ChevronRight, X, CheckCircle, Circle,
  ArrowLeft, ArrowRight, Copy, Check, Sparkles, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface TutorialStep {
  title: string;
  explanation: string;
  code?: string;
  language?: string;
  tip?: string;
}

interface Tutorial {
  id: string;
  title: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  duration: number;
  tags: string[];
  description: string;
  icon: string;
  color: string;
  steps: TutorialStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: "1",
    title: "Prompt Engineering Mastery",
    category: "prompt-engineering",
    level: "intermediate",
    duration: 45,
    tags: ["prompts", "GPT", "Claude"],
    description: "Master the art of crafting effective prompts for any LLM. From zero-shot to chain-of-thought.",
    icon: "✍️",
    color: "from-pink-500 to-rose-600",
    steps: [
      {
        title: "Understanding Zero-Shot Prompting",
        explanation: "Zero-shot prompting means asking the model to do something without any examples. This works for straightforward tasks the model has seen in training. The key is being specific and clear about what you want.",
        code: `// Zero-shot: No examples given
const prompt = \`Classify the sentiment of this review as
Positive, Negative, or Neutral.

Review: "The product arrived late but works perfectly."

Sentiment:\`;`,
        language: "javascript",
        tip: "Be explicit about the output format you expect.",
      },
      {
        title: "Few-Shot Prompting with Examples",
        explanation: "Few-shot prompting provides 2-5 examples before the actual task. This dramatically improves accuracy for complex or niche tasks by showing the model the pattern you expect.",
        code: `const prompt = \`Classify sentiment as Positive/Negative/Neutral.

Review: "Amazing quality!" → Positive
Review: "Broken on arrival." → Negative
Review: "Okay, nothing special." → Neutral

Review: "Fast shipping but missing items." → \`;`,
        language: "javascript",
        tip: "Use diverse, representative examples that cover edge cases.",
      },
      {
        title: "Chain-of-Thought (CoT) Prompting",
        explanation: "Chain-of-Thought prompting asks the model to reason step by step before giving the final answer. This dramatically improves accuracy on math, logic, and multi-step reasoning tasks.",
        code: `const prompt = \`Solve this problem step by step.

Problem: A store has 150 apples. They sell 40% on Monday
and 25% of the remainder on Tuesday. How many are left?

Think step by step:
1. Calculate Monday's sales:
2. Calculate remaining after Monday:
3. Calculate Tuesday's sales:
4. Calculate final remaining:

Answer:\`;`,
        language: "javascript",
        tip: 'Add "Let\'s think step by step" or number the reasoning steps to activate CoT.',
      },
      {
        title: "System Prompt Architecture",
        explanation: "The system prompt defines the AI's persona, capabilities, constraints, and output format. A well-structured system prompt consistently produces better outputs than relying on the user turn alone.",
        code: `const systemPrompt = \`You are DataBot, an expert data analyst at TechCorp.

## Your Role
Analyze data, generate insights, and create actionable reports.

## Capabilities
- Statistical analysis
- Chart recommendations
- Business insight extraction

## Rules
- Always cite data sources
- Flag statistical uncertainty
- Never hallucinate numbers

## Output Format
Use markdown with:
- Executive summary (2-3 sentences)
- Key findings (bulleted)
- Recommendations (numbered)
\`;`,
        language: "javascript",
        tip: "Separate role, capabilities, rules, and format with clear headers.",
      },
      {
        title: "Structured Output with JSON",
        explanation: "For applications that process AI output programmatically, force structured JSON responses. This makes parsing reliable and prevents the model from adding unwanted prose.",
        code: `const prompt = \`Extract product information and return ONLY valid JSON.
Do not add any text before or after the JSON.

Text: "The iPhone 15 Pro costs $999 and has a 48MP camera
with 256GB storage, released September 2023."

Return this exact JSON structure:
{
  "name": string,
  "price": number,
  "specs": string[],
  "releaseYear": number
}\`;

// Parse the response
const response = await chat(prompt);
const product = JSON.parse(response); // Safe because we enforced JSON`,
        language: "javascript",
        tip: "Use GPT-4/Claude with JSON mode enabled when available for guaranteed valid JSON.",
      },
    ],
  },
  {
    id: "2",
    title: "Build Your First AI Agent with LangChain",
    category: "agent-development",
    level: "beginner",
    duration: 60,
    tags: ["LangChain", "Python", "agents"],
    description: "Create a complete AI agent with tools, memory, and planning capabilities from scratch.",
    icon: "🤖",
    color: "from-violet-500 to-purple-600",
    steps: [
      {
        title: "Install LangChain and Setup",
        explanation: "Start by installing the required packages. LangChain provides the orchestration framework, and we'll use OpenRouter for free model access.",
        code: `# Install dependencies
pip install langchain langchain-openai python-dotenv

# .env file
OPENROUTER_API_KEY=your_key_here`,
        language: "bash",
        tip: "Use a virtual environment: python -m venv .venv && source .venv/bin/activate",
      },
      {
        title: "Connect to OpenRouter (Free Models)",
        explanation: "LangChain works with OpenRouter through the OpenAI-compatible API. This gives you access to DeepSeek, Llama, Gemma, and dozens of free models without changing your code.",
        code: `from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

# Use any free model via OpenRouter
llm = ChatOpenAI(
    model="meta-llama/llama-3.2-3b-instruct:free",
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base="https://openrouter.ai/api/v1",
    temperature=0.7,
)

# Test it
response = llm.invoke("What is LangChain?")
print(response.content)`,
        language: "python",
        tip: "Free models on OpenRouter include llama-3.2-3b:free, gemma-3-1b:free, and deepseek-v3:free.",
      },
      {
        title: "Define Tools for Your Agent",
        explanation: "Tools are functions the agent can call to interact with the world. Define them with the @tool decorator, which automatically extracts the docstring as the tool description for the LLM.",
        code: `from langchain.tools import tool
import requests

@tool
def search_ai_news(query: str) -> str:
    """Search for recent AI news articles. Use for current events."""
    # In production, call a real search API
    return f"Found 3 articles about '{query}': [GPT-5 rumors, Claude update, Llama release]"

@tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression. Use for calculations."""
    try:
        result = eval(expression, {"__builtins__": {}})
        return f"Result: {result}"
    except Exception as e:
        return f"Error: {e}"

@tool
def summarize_text(text: str) -> str:
    """Summarize a long piece of text in 2-3 sentences."""
    # The agent will use the LLM for this internally
    return f"Summary of: {text[:50]}..."

tools = [search_ai_news, calculate, summarize_text]`,
        language: "python",
        tip: "Write clear, specific docstrings — the LLM reads them to decide when to use each tool.",
      },
      {
        title: "Create the Agent with Memory",
        explanation: "Combine the LLM, tools, and memory into a complete agent using LangChain's create_react_agent function. The agent will reason about which tools to use and maintain conversation history.",
        code: `from langchain.agents import create_react_agent, AgentExecutor
from langchain.memory import ConversationBufferWindowMemory
from langchain import hub

# Pull the standard ReAct prompt
prompt = hub.pull("hwchase17/react-chat")

# Create agent with memory (remembers last 10 messages)
memory = ConversationBufferWindowMemory(
    memory_key="chat_history",
    return_messages=True,
    k=10
)

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True,      # Shows reasoning steps
    max_iterations=5,  # Prevent infinite loops
    handle_parsing_errors=True,
)`,
        language: "python",
        tip: "Set verbose=True during development to see the agent's reasoning chain.",
      },
      {
        title: "Run Your Agent",
        explanation: "Your agent is ready. It will automatically decide which tools to use, chain multiple tool calls, and maintain conversation context across turns.",
        code: `# Single turn
result = agent_executor.invoke({
    "input": "What's the latest AI news and how many articles is that times 5?"
})
print(result["output"])

# Multi-turn conversation (memory persists automatically)
responses = []
questions = [
    "Search for news about DeepSeek",
    "How many results did you find?",  # Agent remembers context
    "Calculate 15% of 1000",
]

for question in questions:
    response = agent_executor.invoke({"input": question})
    print(f"Q: {question}")
    print(f"A: {response['output']}\\n")`,
        language: "python",
        tip: "The agent automatically maintains conversation history through the memory object.",
      },
    ],
  },
  {
    id: "3",
    title: "RAG Pipeline with Chroma & OpenRouter",
    category: "rag",
    level: "intermediate",
    duration: 90,
    tags: ["RAG", "embeddings", "vector DB"],
    description: "Build a production-grade RAG system — ingest documents, create embeddings, and query with LLMs.",
    icon: "🔍",
    color: "from-blue-500 to-cyan-600",
    steps: [
      {
        title: "What is RAG and Why Use It?",
        explanation: "RAG (Retrieval Augmented Generation) solves the #1 problem with LLMs: they don't know your private data or recent events. RAG retrieves relevant context from your documents and injects it into the prompt before generating a response.",
        tip: "Use RAG instead of fine-tuning when your data changes frequently or when you need citations.",
      },
      {
        title: "Install and Setup ChromaDB",
        explanation: "ChromaDB is a local vector database — perfect for development. It stores document embeddings and enables semantic similarity search without any cloud setup.",
        code: `pip install chromadb langchain langchain-openai sentence-transformers

# Initialize ChromaDB (persists to ./chroma_db folder)
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"}
)

print(f"Collection ready: {collection.name}")`,
        language: "bash",
        tip: "For production, replace ChromaDB with Pinecone, Weaviate, or pgvector.",
      },
      {
        title: "Chunk and Embed Documents",
        explanation: "LLMs have context limits, so documents must be split into chunks. We then convert each chunk into a vector embedding — a numerical representation of its meaning.",
        code: `from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import hashlib

# Load embedding model (runs locally, no API key needed)
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Splitter: 500 char chunks with 50 char overlap
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\\n\\n", "\\n", " ", ""]
)

def ingest_document(text: str, source: str):
    """Split, embed, and store a document."""
    chunks = splitter.split_text(text)

    embeddings = embedder.encode(chunks).tolist()
    ids = [hashlib.md5(f"{source}_{i}".encode()).hexdigest()
           for i in range(len(chunks))]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=[{"source": source, "chunk": i}
                   for i in range(len(chunks))]
    )
    print(f"Ingested {len(chunks)} chunks from: {source}")
    return len(chunks)`,
        language: "python",
        tip: "Chunk size is critical: too small loses context, too large reduces relevance. 300-800 chars works for most text.",
      },
      {
        title: "Retrieve Relevant Context",
        explanation: "When a question comes in, embed it the same way as documents, then find the most semantically similar chunks using cosine similarity. These become the context for your LLM.",
        code: `def retrieve(query: str, top_k: int = 4) -> list[dict]:
    """Find the most relevant document chunks."""
    # Embed the query
    query_embedding = embedder.encode([query])[0].tolist()

    # Semantic search in ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        chunks.append({
            "text": doc,
            "source": meta["source"],
            "relevance": 1 - dist  # Convert distance to similarity
        })

    return chunks

# Test retrieval
chunks = retrieve("What is the capital of France?")
for c in chunks:
    print(f"[{c['relevance']:.2f}] {c['source']}: {c['text'][:100]}...")`,
        language: "python",
        tip: "Filter chunks with relevance < 0.5 — low-relevance context can hurt more than help.",
      },
      {
        title: "Generate Answers with Citations",
        explanation: "Combine retrieval and generation: inject the retrieved chunks as context, ask the LLM to answer from that context only, and include citations.",
        code: `from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

def rag_answer(question: str) -> dict:
    """Answer a question using RAG with citations."""
    # 1. Retrieve relevant chunks
    chunks = retrieve(question, top_k=4)

    # 2. Format context with source labels
    context = "\\n\\n".join([
        f"[Source {i+1} — {c['source']}]:\\n{c['text']}"
        for i, c in enumerate(chunks)
    ])

    # 3. Generate answer
    response = client.chat.completions.create(
        model="meta-llama/llama-3.2-3b-instruct:free",
        messages=[
            {"role": "system", "content": """Answer using ONLY the provided context.
Cite sources as [Source 1], [Source 2], etc.
If context doesn't contain the answer, say "I don't have that information." """},
            {"role": "user", content": f"Context:\\n{context}\\n\\nQuestion: {question}"}
        ]
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": [c["source"] for c in chunks],
        "chunks_used": len(chunks)
    }

# Test it
result = rag_answer("What AI models were released this month?")
print(result["answer"])
print("Sources:", result["sources"])`,
        language: "python",
        tip: "Always tell the LLM to only use provided context — otherwise it will hallucinate answers from its training data.",
      },
    ],
  },
  {
    id: "4",
    title: "Model Context Protocol (MCP) from Scratch",
    category: "mcp",
    level: "advanced",
    duration: 120,
    tags: ["MCP", "Anthropic", "tools"],
    description: "Implement MCP servers and clients — connect Claude to any data source or tool with MCP.",
    icon: "🔌",
    color: "from-amber-500 to-orange-600",
    steps: [
      {
        title: "What is MCP?",
        explanation: "Model Context Protocol (MCP) is an open standard by Anthropic that lets AI models securely connect to data sources and tools. Instead of building custom integrations, MCP provides a universal interface — like USB-C for AI.",
        tip: "MCP is already supported by Claude Desktop, Cursor, VS Code Copilot, and growing fast.",
      },
      {
        title: "Install the MCP SDK",
        explanation: "The official MCP TypeScript SDK makes building servers straightforward. An MCP server exposes tools, resources, and prompts that AI clients can discover and use.",
        code: `npm install @modelcontextprotocol/sdk zod

# Your MCP server project structure:
# mcp-server/
# ├── index.ts       ← Server entry point
# ├── tools.ts       ← Tool definitions
# └── package.json`,
        language: "bash",
        tip: "MCP servers can be written in Python or TypeScript.",
      },
      {
        title: "Create Your First MCP Server",
        explanation: "Build a minimal MCP server that exposes an AI news search tool. The server declares its capabilities and Claude can discover and use them automatically.",
        code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "aihub-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Declare available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_ai_news",
      description: "Get latest AI news from AIHub",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "News category: all, openai, anthropic, google, research",
            enum: ["all", "openai", "anthropic", "google", "research"],
          },
          limit: {
            type: "number",
            description: "Number of articles (1-10)",
            default: 5,
          },
        },
        required: [],
      },
    },
  ],
}));`,
        language: "typescript",
        tip: "Tools are self-describing — Claude reads the name, description, and schema to understand how to use them.",
      },
      {
        title: "Implement Tool Handlers",
        explanation: "When Claude calls a tool, MCP routes the call to your handler. Return structured data that Claude can interpret and include in its response.",
        code: `// Handle tool calls from Claude
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_ai_news") {
    const category = (args?.category as string) || "all";
    const limit = (args?.limit as number) || 5;

    // Fetch from your AIHub API
    const response = await fetch(
      \`http://localhost:3005/api/news?category=\${category}&limit=\${limit}\`
    );
    const data = await response.json();
    const articles = data.articles || [];

    return {
      content: [
        {
          type: "text",
          text: articles
            .slice(0, limit)
            .map((a: { title: string; source: string; summary: string }) =>
              \`📰 \${a.title}\\nSource: \${a.source}\\n\${a.summary}\\n\`
            )
            .join("\\n---\\n"),
        },
      ],
    };
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);`,
        language: "typescript",
        tip: "Return content as an array of typed blocks (text, image, resource). Claude understands all of them.",
      },
      {
        title: "Connect to Claude Desktop",
        explanation: "Add your MCP server to Claude Desktop's configuration file. Once added, Claude will automatically discover and offer your tools in every conversation.",
        code: `// macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
// Windows: %APPDATA%\\Claude\\claude_desktop_config.json

{
  "mcpServers": {
    "aihub": {
      "command": "node",
      "args": ["/absolute/path/to/your/mcp-server/dist/index.js"],
      "env": {
        "AIHUB_API_URL": "http://localhost:3005"
      }
    }
  }
}

// Then restart Claude Desktop.
// You'll see a hammer icon (🔨) in the chat UI.
// Claude will automatically use your tools when relevant.`,
        language: "json",
        tip: "After updating the config, always restart Claude Desktop completely for changes to take effect.",
      },
    ],
  },
  {
    id: "5",
    title: "Run Llama 3 Locally with Ollama",
    category: "ollama",
    level: "beginner",
    duration: 30,
    tags: ["Ollama", "Llama 3", "local AI"],
    description: "Set up Ollama, download models, and build a local AI chat app. Zero cloud costs.",
    icon: "💻",
    color: "from-teal-500 to-green-600",
    steps: [
      {
        title: "Install Ollama",
        explanation: "Ollama makes running large language models locally as easy as running Docker containers. It handles model downloading, GPU acceleration, and serving an OpenAI-compatible API.",
        code: `# macOS / Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Download from https://ollama.ai/download

# Verify installation
ollama --version`,
        language: "bash",
        tip: "Ollama requires at least 8GB RAM for 7B models. For best performance, use a machine with an NVIDIA GPU.",
      },
      {
        title: "Download and Run Models",
        explanation: "Ollama can download and run hundreds of open-source models with a single command. The first download takes a few minutes but subsequent runs are instant.",
        code: `# Run Llama 3.2 3B (fast, runs on most machines)
ollama run llama3.2:3b

# Run Llama 3.1 8B (better quality, needs more RAM)
ollama run llama3.1:8b

# Other great free models:
ollama run deepseek-r1:7b    # Excellent reasoning
ollama run mistral:7b         # Fast and capable
ollama run codellama:7b       # Optimized for code
ollama run phi3.5:mini        # Microsoft's tiny but smart model

# List downloaded models
ollama list

# Ollama serves on http://localhost:11434 automatically`,
        language: "bash",
        tip: "Use ollama run for interactive chat, or leave it running as a server for API access.",
      },
      {
        title: "Call Ollama from Python",
        explanation: "Ollama's REST API is OpenAI-compatible, so any code that works with OpenAI also works with Ollama. Just change the base URL.",
        code: `from openai import OpenAI

# Point to local Ollama instead of OpenAI
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # Required by library, not used
)

def chat_local(message: str, model: str = "llama3.2:3b") -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": message}
        ],
        temperature=0.7,
    )
    return response.choices[0].message.content

# Test it — completely free and private!
reply = chat_local("Explain the transformer architecture in 3 bullets")
print(reply)`,
        language: "python",
        tip: "Ollama works offline — perfect for private data that shouldn't leave your machine.",
      },
      {
        title: "Streaming Responses",
        explanation: "Streaming shows the response token-by-token as it's generated, just like ChatGPT's interface. This dramatically improves perceived performance for long responses.",
        code: `async def chat_stream(message: str, model: str = "llama3.2:3b"):
    """Stream tokens as they're generated."""
    stream = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": message}],
        stream=True,
    )

    print("AI: ", end="", flush=True)
    full_response = ""

    for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        print(token, end="", flush=True)
        full_response += token

    print()  # New line when done
    return full_response

import asyncio
asyncio.run(chat_stream("Write a haiku about local AI models"))`,
        language: "python",
        tip: "For web apps, use Server-Sent Events (SSE) to stream Ollama responses to the browser.",
      },
      {
        title: "Build a Simple Chat UI",
        explanation: "Connect everything into a minimal Next.js chat interface that uses your local Ollama instance — zero API costs, complete privacy.",
        code: `// app/api/ollama-chat/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, model = 'llama3.2:3b' } = await req.json();

  const ollamaRes = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  // Stream the response to the browser
  return new Response(ollamaRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}`,
        language: "typescript",
        tip: "Running Ollama + Next.js gives you a fully private AI app — data never leaves your machine.",
      },
    ],
  },
  {
    id: "6",
    title: "OpenRouter: Access 100+ Models with One API",
    category: "openrouter",
    level: "beginner",
    duration: 25,
    tags: ["OpenRouter", "API", "free models"],
    description: "Use OpenRouter to access Claude, GPT, Llama, Mistral, and DeepSeek with a single API.",
    icon: "🌐",
    color: "from-indigo-500 to-violet-600",
    steps: [
      {
        title: "Get Your Free OpenRouter API Key",
        explanation: "OpenRouter is an API aggregator that gives you access to 200+ AI models through a single OpenAI-compatible endpoint. Many models are completely free.",
        code: `# 1. Create account at https://openrouter.ai
# 2. Go to Keys → Create Key
# 3. Copy your key (starts with sk-or-v1-)
# 4. Add to .env:

OPENROUTER_API_KEY=sk-or-v1-your-key-here`,
        language: "bash",
        tip: "Free models include DeepSeek V3, Llama 3.2, Gemma 3, Qwen, and many more.",
      },
      {
        title: "Make Your First API Call",
        explanation: "OpenRouter is 100% OpenAI-compatible — just change the base URL and API key. Your existing OpenAI code works with zero changes.",
        code: `import OpenAI from 'openai'; // npm install openai

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000', // Required
    'X-Title': 'My AI App',                  // Optional
  },
});

const response = await client.chat.completions.create({
  model: 'meta-llama/llama-3.2-3b-instruct:free', // Free!
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain RAG in one paragraph.' },
  ],
});

console.log(response.choices[0].message.content);`,
        language: "typescript",
        tip: "Append :free to any model ID to use the free tier (e.g., deepseek/deepseek-v3:free).",
      },
      {
        title: "Browse and Compare Free Models",
        explanation: "OpenRouter offers dozens of free models. Here are the best ones for different use cases in 2025.",
        code: `// Best free models by use case:

const FREE_MODELS = {
  // Best overall free model (GPT-4o quality)
  best: "deepseek/deepseek-v3-0324:free",

  // Best for coding
  coding: "deepseek/deepseek-coder-v2-instruct:free",

  // Best for reasoning/math
  reasoning: "deepseek/deepseek-r1:free",

  // Best small/fast model
  fast: "meta-llama/llama-3.2-3b-instruct:free",

  // Best for long context
  longContext: "google/gemma-3-27b-it:free",

  // Best for JSON/structured output
  structured: "mistralai/mistral-7b-instruct:free",

  // List all available models
  listEndpoint: "https://openrouter.ai/api/v1/models",
};`,
        language: "typescript",
        tip: "Check openrouter.ai/models filtered by :free to see the latest free models.",
      },
      {
        title: "Model Routing and Fallbacks",
        explanation: "OpenRouter can automatically route to the best available model or try fallbacks when a model is unavailable. This makes your app more resilient.",
        code: `// Automatic fallback: try primary, fall back to alternative
const response = await client.chat.completions.create({
  model: 'openrouter/auto',  // Routes to best model for your prompt
  // OR specify fallbacks:
  models: [
    'anthropic/claude-3.5-sonnet',     // Primary (paid)
    'deepseek/deepseek-v3:free',        // Fallback 1 (free)
    'meta-llama/llama-3.2-3b:free',    // Fallback 2 (free)
  ],
  route: 'fallback',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Check which model actually responded
console.log('Used model:', response.model);
console.log('Cost:', response.usage);`,
        language: "typescript",
        tip: "Use fallbacks in production so your app keeps working even if a free model is rate-limited.",
      },
    ],
  },
];

const LEVEL_COLORS: Record<string, string> = {
  beginner: "success",
  intermediate: "info",
  advanced: "warning",
  expert: "destructive",
};

export default function TutorialsPage() {
  const [category, setCategory]         = useState("all");
  const [level, setLevel]               = useState("all");
  const [search, setSearch]             = useState("");
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep]   = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied]             = useState(false);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");

  const filtered = TUTORIALS.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (level !== "all" && t.level !== level) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openTutorial(tutorial: Tutorial) {
    setActiveTutorial(tutorial);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setAiExplanation("");
  }

  function closeTutorial() {
    setActiveTutorial(null);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setAiExplanation("");
  }

  function markStepComplete() {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setAiExplanation("");
    } else {
      toast.success("🎉 Tutorial complete! Well done.", { duration: 4000 });
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied!");
  }

  async function askAIToExplain() {
    if (!activeTutorial) return;
    const step = activeTutorial.steps[currentStep];
    setAiExplaining(true);
    setAiExplanation("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-3b-instruct:free",
          messages: [
            {
              role: "system",
              content: "You are a patient AI coding tutor. Explain concepts clearly for someone learning. Be concise (max 3-4 sentences), use simple analogies, and avoid jargon.",
            },
            {
              role: "user",
              content: `Explain this concept from the tutorial "${activeTutorial.title}" — step "${step.title}": ${step.explanation}${step.code ? `\n\nCode:\n${step.code}` : ""}\n\nGive a simple, clear explanation.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiExplanation(data.content ?? "");
    } catch {
      toast.error("Couldn't get AI explanation right now.");
    } finally {
      setAiExplaining(false);
    }
  }

  const CATEGORIES = [
    { id: "all", label: "All", icon: BookOpen },
    { id: "prompt-engineering", label: "Prompts", icon: Search },
    { id: "agent-development", label: "Agents", icon: Bot },
    { id: "rag", label: "RAG", icon: Search },
    { id: "mcp", label: "MCP", icon: Zap },
    { id: "ollama", label: "Ollama", icon: Code },
    { id: "openrouter", label: "OpenRouter", icon: Brain },
  ];

  // ── Tutorial Reader ────────────────────────────────────────────────────
  if (activeTutorial) {
    const step = activeTutorial.steps[currentStep];
    const progress = ((completedSteps.size) / activeTutorial.steps.length) * 100;
    const isLastStep = currentStep === activeTutorial.steps.length - 1;
    const isStepDone = completedSteps.has(currentStep);

    return (
      <div className="flex flex-col h-screen">
        <TopBar title={activeTutorial.title} description={`Step ${currentStep + 1} of ${activeTutorial.steps.length}`} />

        <div className="flex flex-1 overflow-hidden">
          {/* Step Navigation Sidebar */}
          <div className="w-64 border-r border-border flex flex-col flex-shrink-0 bg-muted/20">
            <div className="p-4 border-b border-border">
              <button onClick={closeTutorial} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
                <ArrowLeft className="h-4 w-4" />
                All Tutorials
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{activeTutorial.icon}</span>
                <p className="text-sm font-semibold leading-tight">{activeTutorial.title}</p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{completedSteps.size}/{activeTutorial.steps.length} steps done</p>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {activeTutorial.steps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentStep(i); setAiExplanation(""); }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      i === currentStep ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {completedSteps.has(i)
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <Circle className={`h-4 w-4 ${i === currentStep ? "text-primary" : "text-muted-foreground/40"}`} />}
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-snug">{s.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <ScrollArea className="flex-1">
            <div className="max-w-2xl mx-auto p-8 space-y-6">
              {/* Step Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step {currentStep + 1} of {activeTutorial.steps.length}
                  </span>
                  {isStepDone && <Badge variant="success" className="text-xs">Completed</Badge>}
                </div>
                <h2 className="text-xl font-bold">{step.title}</h2>
              </div>

              {/* Explanation */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed text-foreground/90">{step.explanation}</p>
              </div>

              {/* Code Block */}
              {step.code && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                    <span className="text-xs font-mono text-muted-foreground">{step.language}</span>
                    <button onClick={() => copyCode(step.code!)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <><Check className="h-3.5 w-3.5 text-green-500"/>Copied!</> : <><Copy className="h-3.5 w-3.5"/>Copy code</>}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#1e1e2e] text-[#cdd6f4] text-sm font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {/* Tip */}
              {step.tip && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{step.tip}</p>
                </div>
              )}

              {/* AI Explanation */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI Tutor</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={askAIToExplain} loading={aiExplaining} className="gap-1.5 text-xs h-7">
                    {aiExplaining ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3"/>}
                    {aiExplanation ? "Re-explain" : "Explain this step"}
                  </Button>
                </div>
                {aiExplanation ? (
                  <div className="p-4 text-sm leading-relaxed">{aiExplanation}</div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground text-center py-6">
                    Click &ldquo;Explain this step&rdquo; to get a simplified AI explanation
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" onClick={() => { if (currentStep > 0) { setCurrentStep(p => p - 1); setAiExplanation(""); }}}
                  disabled={currentStep === 0} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex-1" />
                <Button onClick={markStepComplete} className={`gap-2 ${isStepDone && !isLastStep ? "bg-green-500 hover:bg-green-600 border-0" : ""}`}>
                  {isStepDone
                    ? isLastStep
                      ? <><Trophy className="h-4 w-4"/>Finish!</>
                      : <><CheckCircle className="h-4 w-4"/>Next<ArrowRight className="h-4 w-4"/></>
                    : <><CheckCircle className="h-4 w-4"/>Mark Complete & Next</>}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // ── Tutorial List ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Tutorials Academy" description="Step-by-step AI development courses with AI tutoring" />
      <div className="flex-1 p-3 md:p-6 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search tutorials..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 h-9 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}>
              <cat.icon className="h-3 w-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Level Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "beginner", "intermediate", "advanced", "expert"].map((l) => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                level === l ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
              }`}>
              {l}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">{filtered.length} tutorials available</p>

        {/* Tutorial Grid */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
          {filtered.map((tutorial) => (
            <motion.div key={tutorial.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } } }}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col overflow-hidden"
                onClick={() => openTutorial(tutorial)}>
                <div className={`h-1.5 bg-gradient-to-r ${tutorial.color}`} />
                <CardContent className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{tutorial.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{tutorial.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{tutorial.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tutorial.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{tutorial.duration}m
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />{tutorial.steps.length} steps
                      </div>
                    </div>
                    <Badge variant={LEVEL_COLORS[tutorial.level] as "success" | "info" | "warning" | "destructive"} className="text-xs capitalize">
                      {tutorial.level}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); openTutorial(tutorial); }}
                    className={`w-full gap-2 text-xs bg-gradient-to-r ${tutorial.color} border-0`}>
                    <Play className="h-3 w-3" />
                    Start Tutorial
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// Need Trophy icon
function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 2h7l1 4H7.5l1-4zM5 6h14l-1.5 6H6.5L5 6zM9 12v4m6-4v4M6 16h12l1 3H5l1-3z"/>
    </svg>
  );
}
