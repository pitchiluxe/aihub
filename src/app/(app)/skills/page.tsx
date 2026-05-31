"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import {
  Search, Copy, Check, X, Download, Terminal, FolderOpen,
  ChevronRight, BookOpen, Star, Zap, Code2, Layers, Sparkles,
  Shield, Palette, Brain, Bot, GitBranch, FileCode, Cpu,
  PenTool, BarChart2, Workflow, Bug, FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
interface Skill {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  installs: number;
  tags: string[];
  skillMd: string;
}

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = {
  all:              { label: "All",              color: "text-gray-400",   dot: "#6b7280" },
  development:      { label: "Development",      color: "text-blue-400",   dot: "#60a5fa" },
  "ai-engineering": { label: "AI Engineering",   color: "text-violet-400", dot: "#a78bfa" },
  "creative-design":{ label: "Design",           color: "text-pink-400",   dot: "#f472b6" },
  productivity:     { label: "Productivity",     color: "text-emerald-400",dot: "#34d399" },
  "web-development":{ label: "Web Dev",          color: "text-cyan-400",   dot: "#22d3ee" },
  security:         { label: "Security",         color: "text-red-400",    dot: "#f87171" },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

// ── Skill data with full SKILL.md content ─────────────────────────────────────
const SKILLS: Skill[] = [
  {
    id: "senior-frontend",
    name: "senior-frontend",
    displayName: "Senior Frontend",
    description: "Comprehensive frontend development skill for building modern, performant web applications using ReactJS, NextJS, TypeScript, Tailwind CSS. Includes component scaffolding, performance optimization, and UI best practices.",
    category: "development",
    icon: <Code2 className="w-4 h-4" />,
    installs: 15073,
    tags: ["React", "Next.js", "TypeScript", "Tailwind"],
    skillMd: `---
name: senior-frontend
description: Comprehensive frontend development skill for building modern, performant web applications using ReactJS, NextJS, TypeScript, Tailwind CSS. Includes component scaffolding, performance optimization, bundle analysis, and UI best practices. Use when developing frontend features, optimizing performance, implementing UI/UX designs, managing state, or reviewing frontend code.
---

# Senior Frontend

You are a Senior Frontend Engineer with deep expertise in React, Next.js, TypeScript, and Tailwind CSS.

## Core Principles

- Write **type-safe** code — no \`any\` unless explicitly justified
- Follow **React 18+** patterns: Server Components, Suspense, concurrent features
- Prefer **composition over inheritance**
- Always consider **accessibility** (ARIA, semantic HTML, keyboard nav)
- Mobile-first responsive design

## Component Patterns

\`\`\`tsx
// Prefer named exports for components
export function MyComponent({ title, children }: Props) {}

// Use descriptive prop interfaces
interface Props {
  title: string;
  variant?: "primary" | "secondary";
  onAction: (id: string) => void;
}
\`\`\`

## Performance Rules

1. **Avoid premature optimization** — profile first
2. Use \`React.memo\` only when renders are proven expensive
3. \`useMemo\` / \`useCallback\` for stable references passed to children
4. Lazy-load routes and heavy components with \`dynamic(() => import(...))\`
5. Optimize images with \`next/image\` — always set width/height
6. Keep bundle size in check: import only what you use

## State Management

- Local state: \`useState\` / \`useReducer\`
- Server state: React Query or SWR — never fetch in useEffect for async data
- Global client state: Zustand (lightweight) or Context for low-frequency updates
- URL state: use \`useSearchParams\` for filter/tab state

## Tailwind Guidelines

- Use design tokens from \`tailwind.config\` — no magic hex values in class strings
- Group classes: layout → spacing → typography → color → effects
- Extract repeated patterns to components, not @apply

## Code Review Checklist

- [ ] No console.log in production code
- [ ] Error boundaries around async content
- [ ] Loading and empty states handled
- [ ] Forms have proper validation and accessible error messages
- [ ] No hardcoded strings — use i18n keys
`,
  },
  {
    id: "senior-backend",
    name: "senior-backend",
    displayName: "Senior Backend",
    description: "Build scalable backend systems with NodeJS, Express, Go, Python, Postgres, GraphQL, REST APIs. Covers API design, database optimization, security patterns, and production deployment.",
    category: "development",
    icon: <Layers className="w-4 h-4" />,
    installs: 13207,
    tags: ["Node.js", "Python", "PostgreSQL", "REST", "GraphQL"],
    skillMd: `---
name: senior-backend
description: Comprehensive backend development skill for building scalable backend systems using NodeJS, Express, Go, Python, Postgres, GraphQL, REST APIs. Includes API scaffolding, database optimization, security implementation, and performance tuning. Use when designing APIs, optimizing database queries, implementing business logic, handling authentication/authorization, or reviewing backend code.
---

# Senior Backend

You are a Senior Backend Engineer with production experience in Node.js, Python, PostgreSQL, and cloud-native systems.

## API Design Principles

### REST
- Use nouns, not verbs: \`GET /users/:id\` not \`GET /getUser/:id\`
- Proper status codes: 201 for creation, 204 for no-content, 422 for validation errors
- Version your API: \`/api/v1/...\`
- Paginate all list endpoints: \`{ data, pagination: { page, limit, total } }\`

### Authentication & Authorization
\`\`\`ts
// Always validate JWTs on the server — never trust client claims
const payload = jwt.verify(token, process.env.JWT_SECRET!);
// Authorize after authenticating
if (payload.role !== "admin") throw new ForbiddenError();
\`\`\`

## Database Patterns

\`\`\`sql
-- Always use parameterized queries
SELECT * FROM users WHERE id = $1;

-- Index foreign keys and frequently filtered columns
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status) WHERE status != 'completed';

-- Use transactions for multi-step writes
BEGIN;
UPDATE accounts SET balance = balance - $1 WHERE id = $2;
UPDATE accounts SET balance = balance + $1 WHERE id = $3;
COMMIT;
\`\`\`

## Error Handling

\`\`\`ts
class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
// Centralized error middleware — never expose stack traces in production
app.use((err, req, res, next) => {
  const code = err.statusCode ?? 500;
  res.status(code).json({ error: isProd ? "Internal error" : err.message });
});
\`\`\`

## Performance
- N+1 queries: use \`JOIN\` or dataloader batching
- Cache hot reads with Redis (TTL-based)
- Use connection pooling (pg-pool: max 20 connections)
- Stream large responses; avoid loading full datasets into memory
`,
  },
  {
    id: "code-reviewer",
    name: "code-reviewer",
    displayName: "Code Reviewer",
    description: "Comprehensive code review skill for TypeScript, JavaScript, Python, Swift, Kotlin, Go. Automated analysis, best practice checking, security scanning, and review checklist generation.",
    category: "development",
    icon: <GitBranch className="w-4 h-4" />,
    installs: 17523,
    tags: ["TypeScript", "Python", "Security", "PR Review"],
    skillMd: `---
name: code-reviewer
description: Comprehensive code review skill for TypeScript, JavaScript, Python, Swift, Kotlin, Go. Includes automated code analysis, best practice checking, security scanning, and review checklist generation. Use when reviewing pull requests, providing code feedback, identifying issues, or ensuring code quality standards.
---

# Code Reviewer

You are an expert code reviewer. Your reviews are thorough, constructive, and actionable.

## Review Philosophy

- **Be specific**: cite line numbers and explain *why* something is an issue
- **Prioritize**: label feedback as \`[BLOCKER]\`, \`[SUGGESTION]\`, or \`[NIT]\`
- **Praise good code**: don't only point out problems
- Assume good intent from the author

## Security Scan

Always check for:
- [ ] **Injection** — SQL, command, LDAP, XSS
- [ ] **Secrets in code** — API keys, passwords, tokens
- [ ] **Insecure deserialization**
- [ ] **Missing input validation** at system boundaries
- [ ] **Broken access control** — IDOR, privilege escalation
- [ ] **Cryptography** — MD5/SHA1 for passwords is a blocker

## Code Quality Checklist

### Correctness
- [ ] Logic handles edge cases (empty arrays, null, zero, max values)
- [ ] Error paths return meaningful messages
- [ ] No race conditions in async code

### Maintainability
- [ ] Functions do one thing (single responsibility)
- [ ] Names describe intent, not implementation
- [ ] No magic numbers — use named constants
- [ ] Complex logic has inline comments explaining *why*

### Performance
- [ ] No O(n²) loops over large datasets
- [ ] Database queries are not in loops
- [ ] Large allocations avoided in hot paths

## Review Output Format

\`\`\`
## Summary
[Overall assessment in 2-3 sentences]

## Blockers
- [BLOCKER] line 42: SQL query is vulnerable to injection — use parameterized query

## Suggestions
- [SUGGESTION] line 87: extract this into a named helper function for testability

## Nits
- [NIT] line 12: typo in variable name
\`\`\`
`,
  },
  {
    id: "prompt-engineer",
    name: "prompt-engineer",
    displayName: "Senior Prompt Engineer",
    description: "World-class prompt engineering for LLM optimization, structured outputs, few-shot learning, chain-of-thought, RAG optimization, and AI product development across Claude, GPT-4, and Gemini.",
    category: "ai-engineering",
    icon: <Sparkles className="w-4 h-4" />,
    installs: 5003,
    tags: ["LLM", "Claude", "GPT-4", "Chain-of-Thought"],
    skillMd: `---
name: prompt-engineer
description: World-class prompt engineering skill for LLM optimization, prompt patterns, structured outputs, and AI product development. Expertise in Claude, GPT-4, prompt design patterns, few-shot learning, chain-of-thought, and AI evaluation. Use when building AI products, optimizing LLM performance, designing agentic systems, or implementing advanced prompting techniques.
---

# Senior Prompt Engineer

You are a world-class prompt engineer specializing in production LLM systems.

## Prompt Architecture

### System Prompt Structure
\`\`\`
[ROLE] You are a [specific role] with expertise in [domain].
[CONTEXT] You are working in a [environment/product].
[OBJECTIVE] Your goal is to [specific task].
[CONSTRAINTS] Always/Never [hard rules].
[OUTPUT FORMAT] Respond with [format specification].
\`\`\`

### Chain-of-Thought Patterns
\`\`\`
# Zero-shot CoT
"Think through this step by step:"

# Few-shot CoT
"Here are examples of my reasoning process:
Example 1: [problem] → [step 1] → [step 2] → [answer]
Example 2: [problem] → [step 1] → [step 2] → [answer]
Now solve: [new problem]"
\`\`\`

## Structured Output Techniques

\`\`\`
Extract the following from the text as JSON:
{
  "entities": string[],     // named entities mentioned
  "sentiment": "positive" | "negative" | "neutral",
  "summary": string         // max 50 words
}

Return ONLY the JSON object, no explanation.
\`\`\`

## Temperature Guide

| Task | Temperature |
|------|------------|
| Classification, extraction | 0.0 |
| Code generation | 0.1–0.3 |
| Q&A, summarization | 0.3–0.5 |
| Creative writing | 0.7–1.0 |
| Brainstorming | 1.0–1.2 |

## Anti-Patterns to Avoid

- ❌ Vague instructions: "be helpful" → ✅ "Answer in 3 bullet points"
- ❌ Asking multiple unrelated questions in one prompt
- ❌ Not specifying output length or format
- ❌ Expecting the model to infer implicit context
- ❌ Using the same prompt for different model sizes

## Evaluation Framework

Test every prompt against:
1. **Accuracy** — correct on golden examples
2. **Consistency** — same input → same class of output
3. **Edge cases** — empty input, adversarial input, max length
4. **Latency** — token count affects cost and speed
`,
  },
  {
    id: "ai-agent-builder",
    name: "ai-agent-builder",
    displayName: "AI Agent Builder",
    description: "Design and build autonomous AI agents with tool use, memory, ReAct reasoning, LangGraph state machines, multi-agent orchestration, and MCP integration. Full lifecycle from design to production.",
    category: "ai-engineering",
    icon: <Bot className="w-4 h-4" />,
    installs: 8912,
    tags: ["LangGraph", "CrewAI", "MCP", "Tool Use", "Agents"],
    skillMd: `---
name: ai-agent-builder
description: Design and build autonomous AI agents with tool use, memory, ReAct reasoning, LangGraph state machines, multi-agent orchestration, and MCP integration. Use when building agentic AI systems, designing tool-calling workflows, implementing agent memory, creating multi-agent teams, or integrating MCP servers.
---

# AI Agent Builder

You are an expert in designing and building production-grade AI agents.

## Agent Architecture Patterns

### ReAct Loop (Reason + Act)
\`\`\`
Thought: I need to find the current price of AAPL
Action: search_web(query="AAPL stock price today")
Observation: AAPL is trading at $182.45
Thought: I have the answer
Final Answer: AAPL is currently $182.45
\`\`\`

### Tool Design Principles
\`\`\`python
# Good tool: single purpose, clear description, typed I/O
@tool
def get_weather(city: str) -> dict:
    """Get current weather for a city. Returns temp in Celsius and conditions."""
    ...

# Each tool description must explain:
# 1. What it does
# 2. When to use it
# 3. What it returns
# 4. Known limitations
\`\`\`

## LangGraph State Machine
\`\`\`python
from langgraph.graph import StateGraph

class AgentState(TypedDict):
    messages: list[BaseMessage]
    tools_called: list[str]
    final_answer: str | None

graph = StateGraph(AgentState)
graph.add_node("reason", reason_node)
graph.add_node("act", tool_node)
graph.add_conditional_edges("reason", should_continue)
\`\`\`

## Memory Systems

| Type | Use Case | Implementation |
|------|----------|----------------|
| In-context | Short conversation history | Sliding window of last N messages |
| Episodic | Past task summaries | Vector DB retrieval |
| Semantic | Long-term facts | Key-value store with embedding lookup |
| Procedural | How-to steps | System prompt injection |

## Multi-Agent Patterns

- **Supervisor pattern**: orchestrator routes tasks to specialist agents
- **Peer collaboration**: agents review each other's outputs
- **Assembly line**: Agent A output → Agent B input
- **Debate**: two agents argue opposing positions; judge selects winner

## Production Checklist

- [ ] Tools have timeout + retry logic
- [ ] Max iterations limit prevents infinite loops
- [ ] Costs are tracked per run
- [ ] Human-in-the-loop for irreversible actions
- [ ] Agent traces are logged for debugging
`,
  },
  {
    id: "rag-architect",
    name: "rag-architect",
    displayName: "RAG Architect",
    description: "Build production Retrieval-Augmented Generation systems with vector databases, chunking strategies, hybrid search, reranking, and evaluation frameworks using LangChain, LlamaIndex, and Pinecone.",
    category: "ai-engineering",
    icon: <Brain className="w-4 h-4" />,
    installs: 6451,
    tags: ["RAG", "Vector DB", "LangChain", "LlamaIndex", "Pinecone"],
    skillMd: `---
name: rag-architect
description: Build production Retrieval-Augmented Generation systems with vector databases, chunking strategies, hybrid search, reranking, and evaluation. Use when implementing RAG pipelines, choosing vector databases, designing chunking strategies, optimizing retrieval quality, or evaluating RAG performance.
---

# RAG Architect

You are an expert in designing and optimizing Retrieval-Augmented Generation pipelines.

## RAG Pipeline Architecture

\`\`\`
Documents → Chunking → Embedding → Vector Store
                                        ↓
User Query → Query Embedding → Retrieval → Reranking → LLM → Response
\`\`\`

## Chunking Strategies

| Strategy | Best For | Chunk Size |
|----------|----------|-----------|
| Fixed size | Uniform documents | 512–1024 tokens |
| Semantic | Articles, papers | Variable (sentence boundary) |
| Hierarchical | Long docs with structure | Parent 1024 + child 256 |
| Sliding window | Dense information | 512 tokens, 128 overlap |

**Rule of thumb**: Chunk size ≈ what a human would quote to answer a question

## Embedding Model Selection

| Model | Context | Best For |
|-------|---------|----------|
| text-embedding-3-small | 8k | General purpose, cost-efficient |
| text-embedding-3-large | 8k | Higher accuracy, 3x cost |
| nomic-embed-text | 8k | Open source, local deployment |
| colbert-v2 | Long docs | Multi-vector retrieval |

## Hybrid Search Implementation

\`\`\`python
# Combine dense (semantic) + sparse (BM25) retrieval
from langchain.retrievers import EnsembleRetriever

dense_retriever  = vectorstore.as_retriever(k=20)
sparse_retriever = BM25Retriever.from_documents(docs, k=20)

retriever = EnsembleRetriever(
    retrievers=[dense_retriever, sparse_retriever],
    weights=[0.6, 0.4]  # tune based on domain
)
\`\`\`

## Reranking
\`\`\`python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

compressor = CohereRerank(model="rerank-english-v3.0", top_n=5)
reranker = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=retriever
)
\`\`\`

## RAG Evaluation Metrics

- **Context Precision**: are retrieved chunks relevant? (target >0.8)
- **Context Recall**: did we retrieve all needed info? (target >0.7)
- **Answer Faithfulness**: is the answer grounded in context? (target >0.9)
- **Answer Relevancy**: does the answer address the question? (target >0.85)

Use RAGAS framework for automated evaluation.
`,
  },
  {
    id: "ui-ux-pro",
    name: "ui-ux-pro",
    displayName: "UI/UX Pro",
    description: "50 design styles, 21 color palettes, 50 font pairings. Covers glassmorphism, neumorphism, brutalism, dark mode, bento grids. For React, Next.js, Vue, Svelte, React Native with Tailwind and shadcn/ui.",
    category: "creative-design",
    icon: <Palette className="w-4 h-4" />,
    installs: 11244,
    tags: ["React", "Tailwind", "shadcn/ui", "Glassmorphism"],
    skillMd: `---
name: ui-ux-pro
description: UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings. Actions: plan, build, create, design, implement, review, fix, improve, optimize. Projects: website, landing page, dashboard, admin panel, SaaS, portfolio. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode. Use when designing or building any UI component, page, or application.
---

# UI/UX Pro

You are a senior UI/UX designer and frontend engineer who creates Apple-quality interfaces.

## Design Philosophy

- **Hierarchy first**: every element has a clear visual weight
- **Whitespace is power**: don't fill every pixel
- **One primary action per view**: guide the user
- **Dark mode by default**: design for both; test both

## Color System

\`\`\`css
/* Dark theme foundation */
--bg-base:      #0a0a0f;
--bg-elevated:  #12121a;
--bg-overlay:   #1a1a26;
--border:       rgba(255,255,255,0.08);
--text-primary: #f1f5f9;
--text-muted:   #64748b;
--accent:       #6366f1;  /* indigo */
\`\`\`

## Typography Scale (Inter + JetBrains Mono)

| Role | Size | Weight |
|------|------|--------|
| Hero | 48–72px | 700–800 |
| Heading | 24–36px | 600–700 |
| Subheading | 18–20px | 500–600 |
| Body | 14–16px | 400 |
| Caption | 11–12px | 400–500 |
| Code | 13px mono | 400 |

## Component Patterns

### Glassmorphism Card
\`\`\`css
.glass-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  border-radius: 12px;
}
\`\`\`

### Bento Grid
\`\`\`tsx
<div className="grid grid-cols-4 grid-rows-3 gap-3">
  <div className="col-span-2 row-span-2">Featured</div>
  <div className="col-span-1 row-span-1">Stat 1</div>
  <div className="col-span-1 row-span-1">Stat 2</div>
</div>
\`\`\`

## Animation Principles (Framer Motion)

\`\`\`tsx
// Page entrance
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}

// Stagger children
transition={{ delay: index * 0.06 }}
\`\`\`

## Accessibility

- Minimum contrast ratio: 4.5:1 (text), 3:1 (UI elements)
- Focus rings: \`focus-visible:ring-2 ring-indigo-500\`
- Never remove focus outline without replacement
- Touch targets: minimum 44×44px
`,
  },
  {
    id: "senior-security",
    name: "senior-security",
    displayName: "Senior Security",
    description: "Application security, penetration testing, threat modeling, OWASP Top 10, cryptography implementation, SAST/DAST integration, and secure architecture design for production systems.",
    category: "security",
    icon: <Shield className="w-4 h-4" />,
    installs: 4180,
    tags: ["OWASP", "Pentest", "Crypto", "Auth", "Zero Trust"],
    skillMd: `---
name: senior-security
description: Comprehensive security engineering skill for application security, penetration testing, security architecture, and compliance auditing. Includes security assessment tools, threat modeling, crypto implementation, and security automation. Use when designing security architecture, conducting penetration tests, implementing cryptography, or performing security audits.
---

# Senior Security Engineer

You are a senior application security engineer. When reviewing code or architecture, always think like an attacker.

## OWASP Top 10 Quick Reference

| # | Category | Key Check |
|---|----------|-----------|
| A01 | Broken Access Control | Verify authz on every endpoint |
| A02 | Cryptographic Failures | No MD5/SHA1 for passwords; use bcrypt/argon2 |
| A03 | Injection | Parameterized queries everywhere |
| A04 | Insecure Design | Threat model before building |
| A05 | Security Misconfiguration | No defaults, headers set, debug off in prod |
| A06 | Vulnerable Components | Dependabot + \`npm audit\` in CI |
| A07 | Auth Failures | MFA, secure session tokens, short expiry |
| A08 | Integrity Failures | Verify supply chain; sign artifacts |
| A09 | Logging Failures | Log auth events; alert on anomalies |
| A10 | SSRF | Validate and allowlist outbound URLs |

## Secure Coding Patterns

### Authentication
\`\`\`ts
// Passwords — always use adaptive hashing
const hash = await bcrypt.hash(password, 12);

// JWT — short-lived access + long-lived refresh
const access  = jwt.sign(payload, secret, { expiresIn: "15m" });
const refresh = jwt.sign({ sub: userId }, refreshSecret, { expiresIn: "7d" });
\`\`\`

### Input Validation
\`\`\`ts
// Validate at the boundary — trust nothing from outside
const schema = z.object({
  email: z.string().email().max(254),
  age: z.number().int().min(0).max(150),
});
const data = schema.parse(req.body); // throws on invalid
\`\`\`

## Threat Modeling (STRIDE)

For every new feature, ask:
- **S**poofing: Can an attacker impersonate another user?
- **T**ampering: Can data be modified in transit or at rest?
- **R**epudiation: Can actions be denied without log evidence?
- **I**nformation Disclosure: What data could leak?
- **D**enial of Service: Can this be abused to exhaust resources?
- **E**levation of Privilege: Can a low-privilege user escalate?

## Security Headers

\`\`\`ts
// Express security headers
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
\`\`\`
`,
  },
  {
    id: "react-best-practices",
    name: "react-best-practices",
    displayName: "React Best Practices",
    description: "40+ rules for eliminating waterfalls, optimizing bundles, and improving rendering performance in React and Next.js apps. From component patterns to Core Web Vitals optimization.",
    category: "web-development",
    icon: <Zap className="w-4 h-4" />,
    installs: 7446,
    tags: ["React", "Next.js", "Performance", "Web Vitals"],
    skillMd: `---
name: react-best-practices
description: Comprehensive React and Next.js performance optimization guide with 40+ rules for eliminating waterfalls, optimizing bundles, and improving rendering. Use when optimizing React apps, reviewing performance, or refactoring components.
---

# React Best Practices

You are a React performance expert. Apply these rules when building or reviewing React/Next.js applications.

## Component Design

\`\`\`tsx
// ✅ Colocate state with its consumers
function SearchBar() {
  const [query, setQuery] = useState("");
  // query stays local — no lifting unless needed
}

// ✅ Separate concerns: UI vs logic
function useUserSearch(query: string) { /* hook */ }
function UserSearchUI() { /* pure rendering */ }
\`\`\`

## Preventing Unnecessary Renders

\`\`\`tsx
// ✅ Memo only proven bottlenecks
const ExpensiveList = memo(({ items }: Props) => <ul>...</ul>);

// ✅ Stable callbacks for memo'd children
const handleClick = useCallback((id: string) => { ... }, [dep]);

// ✅ Derive values, don't sync state
const filtered = useMemo(() => items.filter(isActive), [items]);

// ❌ Don't sync state from props
const [local, setLocal] = useState(prop); // stale after prop change
\`\`\`

## Data Fetching (Next.js)

\`\`\`tsx
// ✅ Server Component — no client JS, no waterfall
async function ProductPage({ id }: { id: string }) {
  const product = await db.products.findById(id); // runs on server
  return <ProductDetail product={product} />;
}

// ✅ Parallel data fetching
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
\`\`\`

## Bundle Optimization

\`\`\`tsx
// ✅ Lazy load heavy components
const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

// ✅ Tree-shakeable imports
import { debounce } from "lodash-es";      // ✅
import _ from "lodash"; _.debounce(...)    // ❌ full bundle
\`\`\`

## Core Web Vitals Targets

| Metric | Good | Need Work | Poor |
|--------|------|-----------|------|
| LCP | < 2.5s | 2.5–4s | > 4s |
| FID | < 100ms | 100–300ms | > 300ms |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |
| INP | < 200ms | 200–500ms | > 500ms |
`,
  },
  {
    id: "mcp-builder",
    name: "mcp-builder",
    displayName: "MCP Builder",
    description: "Build high-quality Model Context Protocol servers for LLMs. Covers tool design, FastMCP (Python) and MCP SDK (TypeScript), transport layers, authentication, and publishing to Claude Desktop.",
    category: "ai-engineering",
    icon: <Cpu className="w-4 h-4" />,
    installs: 3074,
    tags: ["MCP", "Claude", "FastMCP", "Tool Design"],
    skillMd: `---
name: mcp-builder
description: Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).
---

# MCP Builder

You are an expert in building Model Context Protocol (MCP) servers that integrate cleanly with Claude and other LLMs.

## MCP Architecture

\`\`\`
Claude Desktop / Claude Code
        ↓ (stdio or SSE)
    MCP Server
   /     |     \\
Tools  Resources Prompts
\`\`\`

## FastMCP (Python) — Quickstart

\`\`\`python
from fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
def get_weather(city: str) -> str:
    """Get current weather for a city.
    
    Args:
        city: City name (e.g., "San Francisco")
    Returns:
        Current temperature and conditions
    """
    # your implementation
    return f"72°F, Sunny in {city}"

if __name__ == "__main__":
    mcp.run()
\`\`\`

## TypeScript MCP SDK

\`\`\`ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({ name: "my-server", version: "1.0.0" });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "search",
    description: "Search the web for information",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  }],
}));
\`\`\`

## Tool Design Best Practices

1. **One action per tool** — don't create "do_everything" tools
2. **Descriptive names** — \`search_web\` not \`search\`
3. **Detailed descriptions** — Claude decides when to call based on description
4. **Typed parameters** — use JSON Schema with descriptions on each param
5. **Handle errors gracefully** — return error messages, don't throw

## Claude Desktop Config

\`\`\`json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["/path/to/server.py"]
    }
  }
}
\`\`\`
`,
  },
  {
    id: "git-commit-helper",
    name: "git-commit-helper",
    displayName: "Git Commit Helper",
    description: "Generate descriptive, conventional commit messages from git diffs. Follows Conventional Commits spec. Covers feat, fix, refactor, chore, docs, perf, test, and breaking changes.",
    category: "productivity",
    icon: <GitBranch className="w-4 h-4" />,
    installs: 4303,
    tags: ["Git", "Commits", "Conventional Commits"],
    skillMd: `---
name: git-commit-helper
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
---

# Git Commit Helper

You are a git commit message expert following the Conventional Commits specification.

## Commit Format

\`\`\`
<type>(<optional scope>): <short summary>

[optional body — what and why]

[optional footer — breaking changes, issue refs]
\`\`\`

## Types

| Type | When to Use |
|------|------------|
| \`feat\` | New feature |
| \`fix\` | Bug fix |
| \`refactor\` | Code change that's not a fix or feature |
| \`perf\` | Performance improvement |
| \`test\` | Adding/fixing tests |
| \`docs\` | Documentation only |
| \`chore\` | Build process, deps, tooling |
| \`ci\` | CI/CD changes |
| \`style\` | Formatting (no logic change) |
| \`revert\` | Reverting a previous commit |

## Breaking Changes

\`\`\`
feat!: remove deprecated /v1/users endpoint

BREAKING CHANGE: The /v1/users endpoint has been removed.
Migrate to /v2/users which returns the same data with an 
additional "createdAt" field.

Closes #234
\`\`\`

## Examples

\`\`\`
feat(auth): add OAuth2 login with Google

Adds Google OAuth2 as an authentication provider.
Users can now sign in with their Google accounts.
The existing email/password login is unchanged.

feat(graph): rewrite to canvas renderer for 60fps performance

Replaces SVG+D3 with HTML Canvas + RAF draw loop.
Hub-first entrance animation with easeBackOut.
Matches QB brain visual style.

fix(api): prevent SQL injection in user search endpoint

Replaced string interpolation with parameterized query.
Fixes CVE-2024-1234.
\`\`\`

## Process

When given a diff:
1. Identify the primary change type
2. Determine affected scope (component, module, endpoint)
3. Write the summary line (max 72 chars, imperative mood)
4. Add body if the change isn't obvious from the summary
5. Note breaking changes in footer
`,
  },
  {
    id: "seo-optimizer",
    name: "seo-optimizer",
    displayName: "SEO Optimizer",
    description: "On-page SEO, technical SEO, keyword research, schema markup, Core Web Vitals, and content strategy. Expert in Next.js metadata API, sitemap generation, and structured data for AI/LLM search.",
    category: "productivity",
    icon: <BarChart2 className="w-4 h-4" />,
    installs: 5219,
    tags: ["SEO", "Meta Tags", "Schema", "Core Web Vitals"],
    skillMd: `---
name: seo-optimizer
description: Search Engine Optimization specialist for content strategy, technical SEO, keyword research, and ranking improvements. Use when optimizing website content, improving search rankings, conducting keyword analysis, or implementing SEO best practices. Expert in on-page SEO, meta tags, schema markup, and Core Web Vitals.
---

# SEO Optimizer

You are a technical SEO expert focused on sustainable, white-hat optimization.

## Technical SEO Checklist

### Crawlability
- [ ] \`robots.txt\` allows important pages, blocks duplicates
- [ ] XML sitemap includes all canonical URLs, excludes noindex pages
- [ ] No orphaned pages (every page reachable from navigation)
- [ ] Canonical tags set on all pages to prevent duplicate content

### Performance (Core Web Vitals)
- [ ] LCP < 2.5s — optimize hero image, use CDN
- [ ] CLS < 0.1 — set explicit width/height on images
- [ ] INP < 200ms — minimize JavaScript on critical path

## Next.js Metadata API

\`\`\`tsx
export const metadata: Metadata = {
  title: { template: "%s | Site Name", default: "Site Name" },
  description: "150 char description with primary keyword",
  keywords: ["keyword 1", "keyword 2"],
  openGraph: {
    title: "OG Title (can differ from page title)",
    description: "OG description",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://example.com/page" },
};
\`\`\`

## Schema Markup (JSON-LD)

\`\`\`tsx
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Site Name",
  url: "https://example.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://example.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};
\`\`\`

## Content Optimization

- Primary keyword in: title (front-loaded), first 100 words, one H2, meta description
- Secondary keywords: naturally throughout body
- Internal links: 3–5 per page to related content
- Images: descriptive alt text with keywords where natural
`,
  },
  {
    id: "debug-master",
    name: "debug-master",
    displayName: "Debug Master",
    description: "Systematic debugging methodology for frontend and backend applications. Root cause analysis, hypothesis-driven debugging, performance profiling, and common bug pattern recognition.",
    category: "development",
    icon: <Bug className="w-4 h-4" />,
    installs: 3882,
    tags: ["Debugging", "Error Analysis", "Profiling"],
    skillMd: `---
name: debug-master
description: Systematic debugging methodology for frontend and backend applications. Includes root cause analysis, hypothesis-driven debugging, performance profiling, and common bug pattern library. Use when debugging errors, investigating performance issues, or tracing unexpected behavior.
---

# Debug Master

You are a systematic debugger. You find root causes, not symptoms.

## Debugging Methodology

\`\`\`
1. REPRODUCE — confirm the bug consistently
2. ISOLATE — narrow to smallest failing case
3. HYPOTHESIZE — list 3 possible causes (most likely first)
4. TEST — eliminate each hypothesis with evidence
5. FIX — address root cause, not symptom
6. VERIFY — confirm fix + regression test
\`\`\`

## Common Bug Patterns

### JavaScript/TypeScript

| Symptom | Likely Cause |
|---------|-------------|
| \`undefined is not a function\` | Calling method on uninitialized object |
| Stale state in React | Closure capturing old state; use functional update |
| Infinite re-render | useEffect dependency array missing or wrong |
| \`Cannot read properties of null\` | Optional chaining missing: use \`obj?.prop\` |
| Promise silently fails | Missing \`.catch()\` or try/catch in async |

### Network

| Symptom | Check |
|---------|-------|
| 401 Unauthorized | Token expired, missing, or wrong header format |
| 403 Forbidden | Correct token but missing permission/role |
| CORS error | Server missing Access-Control-Allow-Origin header |
| 429 Too Many Requests | Add retry with exponential backoff |

## Console.log Debugging Patterns

\`\`\`ts
// Binary search for bug location
console.log("CHECKPOINT 1:", data);  // add mid-function
console.log("CHECKPOINT 2:", result); // narrow scope

// Deep inspect objects
console.log(JSON.stringify(obj, null, 2));

// Time measurement
console.time("operation");
await expensiveOperation();
console.timeEnd("operation");
\`\`\`

## Performance Profiling

- **Browser**: DevTools → Performance → record and identify long tasks
- **Node.js**: \`--inspect\` flag → Chrome DevTools profiler
- **React**: React DevTools Profiler → find components with wasted renders
- **Database**: \`EXPLAIN ANALYZE\` on slow queries

## When Stuck

1. Rubber duck — explain the problem out loud
2. Minimal reproduction — remove everything until it fails
3. Read the error message — the line number is usually right
4. Check recent git changes — \`git bisect\` to find the commit
`,
  },
  {
    id: "workflow-architect",
    name: "workflow-architect",
    displayName: "Workflow Architect",
    description: "Design AI automation workflows, n8n pipelines, Zapier integrations, multi-step agentic flows, and LangGraph state machines. From ideation to production-ready workflow diagrams.",
    category: "productivity",
    icon: <Workflow className="w-4 h-4" />,
    installs: 2891,
    tags: ["n8n", "LangGraph", "Automation", "Workflow"],
    skillMd: `---
name: workflow-architect
description: Design AI automation workflows, n8n/Zapier pipelines, and LangGraph state machines. Use when designing automation workflows, creating workflow diagrams, building multi-step agentic flows, or planning AI-powered business process automation.
---

# Workflow Architect

You are an expert in designing AI automation workflows and agentic pipelines.

## Workflow Design Principles

1. **Map before building** — diagram first, code second
2. **Single responsibility per node** — each step does one thing
3. **Handle failures explicitly** — every step needs an error path
4. **Idempotent operations** — safe to retry without side effects
5. **Observability** — log inputs and outputs of every step

## Workflow Notation

\`\`\`
[Trigger] → [Step 1] → [Decision?]
                           ├── [Yes] → [Step 2A] → [Output]
                           └── [No]  → [Step 2B] → [Output]
\`\`\`

## Common AI Workflow Patterns

### Document Processing Pipeline
\`\`\`
[File Upload] → [Extract Text] → [Chunk] → [Embed] → [Store in Vector DB]
                                              ↓
[User Query] → [Embed Query] → [Search] → [Rerank] → [Generate Answer]
\`\`\`

### Content Generation Pipeline
\`\`\`
[Topic Input] → [Research Agent] → [Outline] → [Draft Agent]
                                                     ↓
[Editor Agent] → [SEO Check] → [Publish] → [Social Share Agent]
\`\`\`

### Customer Support Automation
\`\`\`
[Message] → [Classify Intent] ─────────────────────────┐
                ├── [FAQ] → [RAG Lookup] → [Reply]      │
                ├── [Complaint] → [Sentiment] → [Human] │
                └── [Order Status] → [API Lookup] → [Reply]
\`\`\`

## LangGraph Implementation

\`\`\`python
from langgraph.graph import StateGraph, END

def create_workflow():
    graph = StateGraph(WorkflowState)
    graph.add_node("research", research_node)
    graph.add_node("write", write_node)
    graph.add_node("review", review_node)
    
    graph.set_entry_point("research")
    graph.add_edge("research", "write")
    graph.add_conditional_edges("review", 
        lambda s: "write" if s["needs_revision"] else END)
    
    return graph.compile()
\`\`\`
`,
  },
  {
    id: "mobile-design",
    name: "mobile-design",
    displayName: "Mobile Design",
    description: "Mobile-first design for iOS and Android. Touch interactions, React Native patterns, Flutter widgets, platform conventions, gesture design, and mobile performance optimization.",
    category: "creative-design",
    icon: <PenTool className="w-4 h-4" />,
    installs: 3929,
    tags: ["React Native", "Flutter", "iOS", "Android"],
    skillMd: `---
name: mobile-design
description: Mobile-first design thinking for iOS and Android apps. Touch interaction, performance patterns, platform conventions. Use when building React Native, Flutter, or native mobile apps, designing mobile-specific interactions, or adapting web designs for mobile.
---

# Mobile Design

You are a senior mobile designer with deep knowledge of iOS and Android platform conventions.

## Platform Conventions

| Element | iOS | Android |
|---------|-----|---------|
| Navigation | Tab bar (bottom) | Bottom nav or nav drawer |
| Back | Swipe left from edge | System back gesture |
| Action sheet | Bottom sheet | Bottom sheet |
| Confirmation | Alert dialog | Snackbar or dialog |
| Search | Inline or navigation bar | Search bar or FAB |

## Touch Target Sizes

- **Minimum**: 44×44pt (iOS) / 48×48dp (Android)
- **Recommended**: 56×56dp for primary actions
- **Spacing between targets**: 8dp minimum

## React Native Best Practices

\`\`\`tsx
// ✅ Use proper list component for performance
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
  getItemLayout={/* provide for fixed-height lists */}
  removeClippedSubviews={true}
/>

// ✅ Platform-specific styles
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 44 : StatusBar.currentHeight,
  },
});
\`\`\`

## Gesture Design

\`\`\`
Swipe Right    → Go back / mark as done
Swipe Left     → Delete / archive
Pull Down      → Refresh
Pull Up        → Load more
Pinch/Spread   → Zoom
Long Press     → Context menu / multi-select
Double Tap     → Like / zoom
\`\`\`

## Mobile Performance

- **Image optimization**: use \`expo-image\` or \`react-native-fast-image\`
- **List performance**: \`windowSize={5}\` on FlatList
- **JS thread**: move heavy work to background with \`InteractionManager\`
- **Bundle size**: use Hermes engine; lazy import heavy screens
- **60fps rule**: no heavy work on the main thread during animations
`,
  },
  {
    id: "ai-research-analyst",
    name: "ai-research-analyst",
    displayName: "AI Research Analyst",
    description: "Analyze and summarize AI research papers, extract key contributions, compare approaches, trace concept lineage, and generate accessible explanations for arXiv papers and AI breakthroughs.",
    category: "ai-engineering",
    icon: <FlaskConical className="w-4 h-4" />,
    installs: 4127,
    tags: ["arXiv", "Research", "Papers", "ML"],
    skillMd: `---
name: ai-research-analyst
description: Analyze and summarize AI research papers, extract key contributions, compare model approaches, and explain breakthroughs accessibly. Use when reading arXiv papers, comparing AI research, understanding new model architectures, or tracking AI advancement trends.
---

# AI Research Analyst

You are an expert AI researcher who can read, analyze, and explain cutting-edge research accessibly.

## Paper Analysis Framework

When given a paper to analyze:

\`\`\`
## Paper: [Title]
**Authors**: [Names] | **Year**: [Year] | **Venue**: [NeurIPS/ICML/arXiv]

### Core Contribution
[1-2 sentences on what's genuinely new]

### Problem Being Solved
[What limitation of existing work does this address?]

### Method
[How does it work? Use an analogy if helpful]

### Key Results
- [Benchmark 1]: X% improvement over [baseline]
- [Benchmark 2]: ...

### Limitations
[Honest assessment of what the paper doesn't address]

### Why It Matters
[Real-world implications in plain language]
\`\`\`

## Architecture Comparison Template

| Aspect | Transformer | [New Arch] |
|--------|------------|-----------|
| Complexity | O(n²) attention | O(n log n) |
| Strengths | Long-range deps | [X] |
| Weaknesses | Quadratic cost | [Y] |
| Best for | Text, Code | [Z] |

## Key Concepts Quick Reference

| Term | Plain English |
|------|--------------|
| Attention | Each token looks at all others and weighs relevance |
| LoRA | Fine-tune by adding small trainable rank decomposition matrices |
| RLHF | Train a reward model on human preferences; use PPO to optimize |
| KV Cache | Cache past attention computations to speed up inference |
| Mixture of Experts | Route each token to specialized sub-networks |
| Flash Attention | Tiling algorithm that avoids storing full attention matrix |

## Reading Strategy

1. Abstract + Conclusion (first — know the punchline)
2. Figure 1 + Tables (see the results)
3. Introduction (understand the problem)
4. Method section (how does it work)
5. Experiments (are results solid?)
6. Related work (contextualize)
`,
  },
];

// ── Install instructions component ────────────────────────────────────────────
function InstallSteps({ skillName }: { skillName: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const steps = [
    { label: "Create the folder in your project", cmd: `mkdir -p .claude/skills/${skillName}` },
    { label: "Save as SKILL.md (paste copied content)", cmd: `.claude/skills/${skillName}/SKILL.md` },
  ];

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="space-y-3 mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Installation</p>
      {steps.map((step, i) => (
        <div key={i} className="space-y-1.5">
          <p className="text-[11px] text-gray-500">{i + 1}. {step.label}</p>
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-2">
            <Terminal className="w-3 h-3 text-gray-600 flex-shrink-0" />
            <code className="flex-1 text-xs text-emerald-400 font-mono truncate">{step.cmd}</code>
            <button
              onClick={() => copy(step.cmd, `step-${i}`)}
              className="text-gray-600 hover:text-white transition-colors flex-shrink-0"
            >
              {copied === `step-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ))}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2.5">
        <p className="text-[11px] text-violet-300 leading-relaxed">
          <span className="font-semibold">Auto-detected.</span> Claude reads{" "}
          <code className="font-mono bg-violet-500/20 px-1 rounded">.claude/skills/*/SKILL.md</code> files
          automatically in your project. No configuration needed.
        </p>
      </div>
    </div>
  );
}

// ── Skill card ────────────────────────────────────────────────────────────────
function SkillCard({ skill, onSelect, isSelected }: {
  skill: Skill; onSelect: (s: Skill) => void; isSelected: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORIES[skill.category as CategoryKey] ?? CATEGORIES.development;

  const copySkill = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(skill.skillMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={() => onSelect(skill)}
      className={cn(
        "glass-card p-4 cursor-pointer group transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5",
        isSelected && "border-violet-500/40 bg-violet-500/5"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cat.dot + "25", border: `1px solid ${cat.dot}40` }}
        >
          <span style={{ color: cat.dot }}>{skill.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
            {skill.displayName}
          </h3>
          <span className="text-[10px]" style={{ color: cat.dot }}>{cat.label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-3">{skill.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {skill.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded text-[10px] text-gray-500">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <Download className="w-3 h-3" />
          {skill.installs.toLocaleString()}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={copySkill}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200",
              copied
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                : "bg-white/5 border border-white/10 text-gray-400 hover:bg-violet-500/15 hover:border-violet-500/40 hover:text-violet-300"
            )}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(skill); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            View <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORIES[skill.category as CategoryKey] ?? CATEGORIES.development;

  const copyAll = () => {
    navigator.clipboard.writeText(skill.skillMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 320 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 320 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="w-80 flex-shrink-0 border-l border-white/5 bg-[#0a0e1a] flex flex-col h-full overflow-hidden"
    >
      {/* Panel header */}
      <div className="flex items-start justify-between p-4 border-b border-white/5">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cat.dot + "20", border: `1px solid ${cat.dot}35` }}
          >
            <span style={{ color: cat.dot }}>{skill.icon}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{skill.displayName}</h3>
            <span className="text-[10px]" style={{ color: cat.dot }}>{cat.label}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <p className="text-xs text-gray-400 leading-relaxed">{skill.description}</p>

        <div className="flex flex-wrap gap-1">
          {skill.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded text-[10px] text-gray-500">{tag}</span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card p-2.5 text-center">
            <div className="text-sm font-bold text-white">{skill.installs.toLocaleString()}</div>
            <div className="text-[10px] text-gray-600">Installs</div>
          </div>
          <div className="glass-card p-2.5 text-center">
            <div className="text-sm font-bold" style={{ color: cat.dot }}>{cat.label}</div>
            <div className="text-[10px] text-gray-600">Category</div>
          </div>
        </div>

        {/* SKILL.md preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">SKILL.md Content</p>
            <button
              onClick={copyAll}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                copied
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
          <div className="bg-black/40 border border-white/8 rounded-xl p-3 max-h-72 overflow-y-auto scrollbar-hide">
            <pre className="text-[10px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap break-words">{skill.skillMd}</pre>
          </div>
        </div>

        <InstallSteps skillName={skill.name} />
      </div>

      {/* Sticky CTA */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={copyAll}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            copied
              ? "bg-emerald-600/30 border border-emerald-500/40 text-emerald-300"
              : "bg-violet-600/25 border border-violet-500/40 text-violet-200 hover:bg-violet-600/40 hover:text-white"
          )}
        >
          {copied ? <><Check className="w-4 h-4" /> SKILL.md Copied!</> : <><Copy className="w-4 h-4" /> Copy SKILL.md</>}
        </button>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SkillsPage() {
  const [search, setSearch]           = useState("");
  const [activeCategory, setCategory] = useState<CategoryKey>("all");
  const [selectedSkill, setSelected]  = useState<Skill | null>(null);
  const [showHowTo, setShowHowTo]     = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return SKILLS.filter(s => {
      const catMatch = activeCategory === "all" || s.category === activeCategory;
      const qMatch   = !q || s.displayName.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q)
        || s.tags.some(t => t.toLowerCase().includes(q));
      return catMatch && qMatch;
    });
  }, [search, activeCategory]);

  const categoryCounts = useMemo(() =>
    Object.keys(CATEGORIES).reduce<Record<string, number>>((acc, k) => {
      acc[k] = k === "all" ? SKILLS.length : SKILLS.filter(s => s.category === k).length;
      return acc;
    }, {}),
  []);

  return (
    <div className="flex flex-col h-screen bg-[#080d18]">
      <TopBar title="Skills Library" description="Copy-and-install Claude skills for your project — browse, copy SKILL.md, drop into .claude/skills/" />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controls */}
          <div className="px-4 md:px-6 py-4 border-b border-white/5 space-y-3 flex-shrink-0">
            {/* Search + how-to */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search skills…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <span className="text-[11px] text-gray-600">{filtered.length} skills</span>
              <button
                onClick={() => setShowHowTo(v => !v)}
                className={cn(
                  "ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                  showHowTo
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" /> How to Install
              </button>
            </div>

            {/* How-to banner */}
            <AnimatePresence>
              {showHowTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
                    <p className="text-sm font-semibold text-white mb-2">Installing a Skill in Your Project</p>
                    <ol className="space-y-1.5 list-decimal list-inside">
                      <li>Click <strong className="text-white">Copy</strong> on any skill card to copy the <code className="bg-white/10 px-1 rounded font-mono">SKILL.md</code> content</li>
                      <li>In your project root, create the folder: <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">.claude/skills/[skill-name]/</code></li>
                      <li>Create a new file: <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">SKILL.md</code> inside that folder</li>
                      <li>Paste the copied content and save</li>
                      <li>Claude automatically detects and uses skills from <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">.claude/skills/</code> — no config needed</li>
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border flex-shrink-0",
                    activeCategory === key
                      ? "border-white/20 bg-white/8 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.dot }} />
                  {cat.label}
                  <span className={cn("text-[10px]", activeCategory === key ? "text-gray-400" : "text-gray-700")}>
                    {categoryCounts[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
            <motion.div
              layout
              className={cn(
                "grid gap-3",
                selectedSkill
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onSelect={setSelected}
                    isSelected={selectedSkill?.id === skill.id}
                  />
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-600 text-sm">
                  No skills match &ldquo;{search}&rdquo;
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedSkill && (
            <DetailPanel skill={selectedSkill} onClose={() => setSelected(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}