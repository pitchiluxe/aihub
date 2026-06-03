"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LiveSkill } from "@/app/api/skills/route";
import { TopBar } from "@/components/layout/TopBar";
import {
  Search, Copy, Check, X, Download, Terminal, FolderOpen,
  ChevronRight, BookOpen, Star, Zap, Code2, Layers, Sparkles,
  Shield, Palette, Brain, Bot, GitBranch, FileCode, Cpu,
  PenTool, BarChart2, Workflow, Bug, FlaskConical,
  Database, Globe, Lock, Rocket, Cloud, Wand2, TestTube,
  MessageSquare, Users, TrendingUp, Music, Camera, Gamepad2,
  Server, Network, Package, Microscope, Radio, Monitor, Smartphone,
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
  devops:           { label: "DevOps",           color: "text-orange-400", dot: "#fb923c" },
  data:             { label: "Data & ML",        color: "text-yellow-400", dot: "#facc15" },
  mobile:           { label: "Mobile",           color: "text-teal-400",   dot: "#2dd4bf" },
  testing:          { label: "Testing",          color: "text-rose-400",   dot: "#fb7185" },
  business:         { label: "Business",         color: "text-indigo-400", dot: "#818cf8" },
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
  // ──────────────────────────────────────────────────────────────────────────
  // 200 NEW SKILLS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "typescript-expert",
    name: "typescript-expert",
    displayName: "TypeScript Expert",
    description: "Master advanced TypeScript patterns, generics, decorators, and type-safe architecture for large-scale applications.",
    category: "development",
    icon: <Code2 className="w-4 h-4" />,
    installs: 8921,
    tags: ["TypeScript", "Types", "Generics"],
    skillMd: `---
name: typescript-expert
description: Advanced TypeScript patterns, generics, utility types, decorators, and type-safe architecture for production applications.
---

# TypeScript Expert

Master advanced TypeScript to build type-safe, maintainable, production-grade applications.

## Advanced Type Patterns

### Conditional Types
\`\`\`ts
// Extract function parameters
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// Discriminated unions for type narrowing
type Result<T> = { success: true; data: T } | { success: false; error: string };

function handle<T>(result: Result<T>) {
  if (result.success) {
    // result.data is available here
  } else {
    // result.error is available here
  }
}
\`\`\`

### Generic Constraints & Inference
\`\`\`ts
// Powerful constraint-based designs
function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>;
}

// Preserved literal types
type BuildUrl<T extends string> = T extends \`\${infer Base}/\${infer Rest}\`
  ? Base | BuildUrl<\`/\${Rest}\`>
  : T;

type Routes = BuildUrl<'/api/users/profile'>; // '/api' | '/api/users' | '/api/users/profile'
\`\`\`

## Utility Types Mastery

- **Partial<T>** — All properties optional
- **Pick<T, K>** — Select subset of properties
- **Omit<T, K>** — Remove properties
- **Record<K, T>** — Map keys to values
- **Readonly<T>** — Immutable properties
- **ReturnType<T>** — Extract return type
- **ThisParameterType<T>** — Extract 'this' context

## Advanced Patterns

### Factory Pattern with Generics
\`\`\`ts
class Factory<T> {
  private instances: Map<string, T> = new Map();
  
  register(key: string, creator: () => T): void {
    this.instances.set(key, creator());
  }
  
  get(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) throw new Error(\`\${key} not registered\`);
    return instance;
  }
}
\`\`\`

### Decorator-Based Architecture
\`\`\`ts
function Memoize(target: any, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  const cache = new Map();
  
  desc.value = function(...args: any[]) {
    const cacheKey = JSON.stringify(args);
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    
    const result = original.apply(this, args);
    cache.set(cacheKey, result);
    return result;
  };
  
  return desc;
}
\`\`\`

## Type Safety Best Practices

1. **Strict Mode** — Enable \`strict: true\` in tsconfig.json
2. **No Implicit Any** — Catch untyped variables
3. **Exhaustive Checking** — Use discriminated unions
4. **Branded Types** — Create distinct types for domain concepts
5. **Type Guards** — Narrow types with predicates

## Performance Optimization

- Use \`type\` over \`interface\` for unions
- Avoid deep nesting in generic types
- Cache complex type computations
- Use \`const\` assertions for literal types

## Build & Compilation

- Use \`skipLibCheck: true\` for faster builds
- Enable incremental compilation
- Use \`isolatedModules: true\` for bundlers
- Configure sourceMaps for debugging

## Common Pitfalls

- ❌ Over-generic types that lose type info
- ❌ Using \`any\` to escape type errors
- ❌ Circular type dependencies
- ❌ Forgetting \`as const\` for literal types`,
  },
  {
    id: "rust-systems",
    name: "rust-systems",
    displayName: "Rust Systems Programming",
    description: "Build high-performance systems, embedded code, and memory-safe applications with Rust.",
    category: "development",
    icon: <Cpu className="w-4 h-4" />,
    installs: 6234,
    tags: ["Rust", "Systems", "Performance"],
    skillMd: `---
name: rust-systems
description: High-performance systems programming with Rust — ownership, lifetimes, and performance.
---

# Rust Systems Programming

Build fast, memory-safe systems without garbage collection.

## Ownership & Lifetimes

- **Ownership** — Each value has one owner; prevents use-after-free
- **Borrowing** — Immutable (&T) or mutable (&mut T) references
- **Lifetimes** — Compiler tracks reference validity automatically

\`\`\`rs
// Ownership transfer
let s1 = String::from("hello");
let s2 = s1;  // s1 moved, no longer valid

// Borrowing
fn len(s: &String) -> usize { s.len() }  // immutable borrow
fn append(s: &mut String, c: char) { s.push(c); }  // mutable borrow
\`\`\`

## Performance Patterns

### Zero-Copy Abstractions
- Use slices (&[T]) instead of owned vectors when possible
- Avoid cloning; use references where applicable
- Use iterators for lazy evaluation

### Memory Layout
\`\`\`rs
// Stack allocation (fast, limited size)
let array: [i32; 100] = [0; 100];

// Heap allocation (flexible)
let vec: Vec<i32> = vec![1, 2, 3];

// Smart pointers
use std::sync::Arc;  // Atomic reference counting
let arc = Arc::new(data);  // Share ownership
\`\`\`

## Concurrency & Thread Safety

- **Send** — Safe to send across threads
- **Sync** — Safe to share across threads
- **Mutex<T>** — Interior mutability with locking
- **Arc<T>** — Atomic reference counting for shared ownership

\`\`\`rs
use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
    let c = Arc::clone(&counter);
    handles.push(thread::spawn(move || {
        let mut num = c.lock().unwrap();
        *num += 1;
    }));
}
\`\`\`

## Best Practices

1. **Follow the Borrow Checker** — Let compiler catch errors
2. **Use Result<T, E>** — Explicit error handling
3. **Pattern Matching** — Exhaustive case handling
4. **Generic Constraints** — Type safety at compile time
5. **No Runtime Overhead** — Abstractions compile away

## Common Use Cases

- CLI tools and servers
- Embedded systems
- Game engines
- Cryptocurrencies & blockchain
- System utilities (ripgrep, fd, exa)

## Performance Comparison

| Task | Rust | C | Go | Python |
|------|------|---|----|---------|
| JSON Parsing | ~50ns | ~60ns | ~200ns | ~5µs |
| Startup | <5ms | ~10ms | ~20ms | ~100ms |
| Memory | Minimal | Minimal | ~5MB | ~50MB |
`,
  },
  {
    id: "go-concurrency",
    name: "go-concurrency",
    displayName: "Go Concurrency & Networking",
    description: "Build concurrent systems, microservices, and networked applications with Go.",
    category: "development",
    icon: <Network className="w-4 h-4" />,
    installs: 7654,
    tags: ["Go", "Concurrency", "Networking"],
    skillMd: `---
name: go-concurrency
description: Concurrent systems, goroutines, channels, and networking with Go.
---

# Go Concurrency & Networking

Build highly concurrent systems with Go's lightweight goroutines.

## Goroutines & Channels

### Goroutines (Lightweight Threads)
\`\`\`go
// Launch concurrent task
go func() {
    // Runs concurrently
}()

// Goroutines are cheap — launch thousands
for i := 0; i < 10000; i++ {
    go process(i)
}
\`\`\`

### Channels (Communication)
\`\`\`go
// Unbuffered channel
results := make(chan string)
go func() {
    results <- "done"  // Send
}()
val := <-results  // Receive

// Buffered channel
results := make(chan string, 10)  // Queue up to 10

// Ranges over channel
for msg := range results {
    fmt.Println(msg)
}
close(results)  // Signal no more values
\`\`\`

## Concurrency Patterns

### Worker Pool
\`\`\`go
jobs := make(chan Job, 100)
results := make(chan Result, 100)

for w := 1; w <= numWorkers; w++ {
    go worker(jobs, results)
}

for j := range jobList {
    jobs <- j
}
close(jobs)
\`\`\`

### Fan-Out / Fan-In
\`\`\`go
// Start multiple workers
var channels []<-chan Result
for i := 0; i < 5; i++ {
    channels = append(channels, startWorker(i))
}

// Merge all channels
func merge(channels ...<-chan Result) <-chan Result {
    var wg sync.WaitGroup
    out := make(chan Result)
    output := func(c <-chan Result) {
        for r := range c {
            out <- r
        }
        wg.Done()
    }
    wg.Add(len(channels))
    for _, c := range channels {
        go output(c)
    }
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}
\`\`\`

## HTTP Servers & APIs

\`\`\`go
http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
    if r.Method == http.MethodGet {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(users)
    }
})

http.ListenAndServe(":8080", nil)  // Handles connections concurrently
\`\`\`

## Synchronization

- **sync.WaitGroup** — Wait for goroutines to finish
- **sync.Mutex** — Protect shared state
- **sync.Once** — Execute code exactly once
- **context.Context** — Cancellation and timeouts

\`\`\`go
var wg sync.WaitGroup
wg.Add(3)

for i := 0; i < 3; i++ {
    go func() {
        defer wg.Done()
        // work
    }()
}
wg.Wait()  // Block until all done
\`\`\`

## Networking

### TCP Server
\`\`\`go
ln, _ := net.Listen("tcp", ":8080")
for {
    conn, _ := ln.Accept()
    go handleConnection(conn)  // Concurrent per client
}
\`\`\`

### gRPC (High-Performance RPC)
- Protocol Buffers for serialization
- HTTP/2 for multiplexing
- Built-in streaming

## Best Practices

1. **Avoid goroutine leaks** — Always close channels
2. **Use context for cancellation** — Respect deadlines
3. **Keep critical sections small** — Lock briefly
4. **Prefer channels over mutexes** — Share memory by communicating
5. **Monitor goroutine count** — runtime.NumGoroutine()

## Performance Tips

- Goroutines: ~2KB each vs threads ~1MB
- Use buffered channels to reduce blocking
- Profile with pprof: \`import _ "net/http/pprof"\`
- Benchmark with testing.B
`,
  },
  {
    id: "python-data-science",
    name: "python-data-science",
    displayName: "Python Data Science Stack",
    description: "NumPy, Pandas, Scikit-learn, and data analysis workflows.",
    category: "data",
    icon: <BarChart2 className="w-4 h-4" />,
    installs: 12543,
    tags: ["Python", "Data", "ML"],
    skillMd: `---
name: python-data-science
description: Python data science stack — NumPy, Pandas, Scikit-learn for analysis and ML.
---

# Python Data Science Stack

Analyze data and build machine learning models with Python's most powerful libraries.

## NumPy Foundations

\`\`\`python
import numpy as np

# Arrays (vectorized, fast)
arr = np.array([1, 2, 3, 4, 5])
arr = np.arange(0, 10, 2)  # [0, 2, 4, 6, 8]
arr = np.linspace(0, 1, 5)  # [0., 0.25, 0.5, 0.75, 1.]

# Shape & reshape
arr = np.random.randn(3, 4)
reshaped = arr.reshape(2, 6)

# Vectorized operations (FAST!)
result = arr * 2 + 1  # No loops needed

# Broadcasting
matrix = np.random.randn(3, 4)
vector = np.array([1, 2, 3, 4])
result = matrix + vector  # Adds to each row
\`\`\`

## Pandas for Data Manipulation

\`\`\`python
import pandas as pd

# Read data
df = pd.read_csv('data.csv')
df = pd.read_excel('data.xlsx')

# Explore
df.head()  # First 5 rows
df.info()  # Data types, nulls
df.describe()  # Statistics

# Selection
df['column_name']  # Get column
df.loc[0]  # Row by label
df.iloc[0]  # Row by position
df[df['age'] > 25]  # Filter

# Grouping
df.groupby('category').agg({
    'price': 'mean',
    'quantity': 'sum'
})

# Pivot
pivot = df.pivot_table(
    values='value',
    index='date',
    columns='category',
    aggfunc='sum'
)

# Joining
result = pd.merge(df1, df2, on='id')
result = df1.join(df2)  # Index-based
\`\`\`

## Scikit-Learn ML Pipeline

\`\`\`python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Scale features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Train model
model = RandomForestClassifier(n_estimators=100, max_depth=10)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(confusion_matrix(y_test, y_pred))
\`\`\`

## Data Cleaning

\`\`\`python
# Handle missing values
df.fillna(df.mean())  # Fill with mean
df.dropna()  # Remove rows with nulls
df.interpolate()  # Linear interpolation

# Remove duplicates
df = df.drop_duplicates()

# Outlier detection
Q1 = df['value'].quantile(0.25)
Q3 = df['value'].quantile(0.75)
IQR = Q3 - Q1
outliers = df[(df['value'] < Q1 - 1.5 * IQR) | (df['value'] > Q3 + 1.5 * IQR)]
\`\`\`

## Feature Engineering

- **Scaling** — StandardScaler, MinMaxScaler
- **Encoding** — OneHotEncoder, LabelEncoder
- **Polynomial Features** — Create interaction terms
- **Feature Selection** — SelectKBest, RFE

\`\`\`python
from sklearn.preprocessing import PolynomialFeatures
poly = PolynomialFeatures(degree=2)
X_poly = poly.fit_transform(X)
\`\`\`

## Model Selection & Tuning

\`\`\`python
from sklearn.model_selection import cross_val_score, GridSearchCV

# Cross-validation
scores = cross_val_score(model, X, y, cv=5)
print(f"Mean: {scores.mean()}, Std: {scores.std()}")

# Hyperparameter tuning
param_grid = {'max_depth': [5, 10, 15], 'n_estimators': [50, 100, 200]}
grid = GridSearchCV(RandomForestClassifier(), param_grid, cv=5)
grid.fit(X_train, y_train)
print(grid.best_params_)
\`\`\`

## Visualization

\`\`\`python
import matplotlib.pyplot as plt
import seaborn as sns

plt.figure(figsize=(10, 6))
plt.scatter(df['x'], df['y'], alpha=0.5)
plt.xlabel('X Label')
plt.ylabel('Y Label')
plt.show()

# Seaborn for statistical viz
sns.heatmap(df.corr(), annot=True)
sns.boxplot(data=df, x='category', y='value')
\`\`\`

## Performance Optimization

- Use **numpy** operations instead of loops
- Use **chunksize** when reading large CSV files
- Use **categorical** dtype for memory efficiency
- Use **Polars** for 10x+ speed on large datasets
`,
  },
  {
    id: "kubernetes-orchestration",
    name: "kubernetes-orchestration",
    displayName: "Kubernetes Orchestration",
    description: "Deploy, manage, and scale containerized applications with Kubernetes.",
    category: "devops",
    icon: <Server className="w-4 h-4" />,
    installs: 9876,
    tags: ["Kubernetes", "DevOps", "Docker"],
    skillMd: `---
name: kubernetes-orchestration
description: Kubernetes for orchestrating, scaling, and managing containerized applications.
---

# Kubernetes Orchestration

Master container orchestration at scale with Kubernetes.

## Core Concepts

- **Pods** — Smallest unit, wraps containers
- **Services** — Expose pods internally/externally
- **Deployments** — Manage pod replicas
- **StatefulSets** — For stateful applications
- **ConfigMaps & Secrets** — Configuration management
- **PersistentVolumes** — Persistent storage

## Deployment Manifest

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
\`\`\`

## Service Exposure

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: my-app
\`\`\`

## Key kubectl Commands

\`\`\`bash
# Deploy
kubectl apply -f deployment.yaml

# Check status
kubectl get pods
kubectl get services
kubectl describe pod my-app-0

# Scaling
kubectl scale deployment my-app --replicas=5

# Rolling updates
kubectl set image deployment/my-app app=my-app:2.0
kubectl rollout status deployment/my-app
kubectl rollout undo deployment/my-app

# Debugging
kubectl logs my-app-0
kubectl exec -it my-app-0 -- /bin/sh

# Port forwarding
kubectl port-forward svc/my-app 8080:8080
\`\`\`

## Best Practices

1. **Resource Requests/Limits** — Always specify
2. **Health Checks** — Use livenessProbe and readinessProbe
3. **Rolling Updates** — Gradual deployment of new versions
4. **Namespaces** — Isolate resources logically
5. **RBAC** — Role-based access control
6. **Network Policies** — Restrict traffic between pods

## Advanced Topics

- **Helm** — Package manager for K8s
- **Operators** — Manage complex applications
- **Service Mesh** (Istio, Linkerd) — Advanced networking
- **ArgoCD** — GitOps continuous deployment
- **Prometheus & Grafana** — Monitoring
`,
  },
  {
    id: "postgres-optimization",
    name: "postgres-optimization",
    displayName: "PostgreSQL Optimization",
    description: "Advanced PostgreSQL indexing, query optimization, and scaling strategies.",
    category: "data",
    icon: <Database className="w-4 h-4" />,
    installs: 8765,
    tags: ["PostgreSQL", "Database", "Performance"],
    skillMd: `---
name: postgres-optimization
description: PostgreSQL performance tuning, indexing, and query optimization for production databases.
---

# PostgreSQL Optimization

Master advanced PostgreSQL for lightning-fast databases.

## Indexing Strategies

\`\`\`sql
-- B-tree index (default)
CREATE INDEX idx_users_email ON users(email);

-- Partial index (for WHERE conditions)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Multi-column index
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- EXPLAIN to analyze queries
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE user_id = 123;
\`\`\`

## Query Optimization

\`\`\`sql
-- Use EXPLAIN to see query plan
EXPLAIN SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > NOW() - INTERVAL '30 days';

-- Avoid N+1: use JOIN instead of separate queries
SELECT u.*, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- Use LIMIT for large results
SELECT * FROM logs LIMIT 1000 OFFSET 0;

-- Aggregate at database level
SELECT DATE(created_at), COUNT(*) as total
FROM orders
GROUP BY DATE(created_at);
\`\`\`

## Connection Pooling

- **pgBouncer** — Lightweight connection pooler
- **PgPool** — Advanced pooling with replication
- Configure pool size: \`pool_size = (2 × CPU cores) + spindle_count\`

## Scaling Strategies

1. **Read Replicas** — Offload reads to secondary servers
2. **Replication** — Streaming replication to standby
3. **Partitioning** — Split large tables by time/range
4. **Sharding** — Distribute data across servers

## Monitoring

\`\`\`sql
-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Cache hit ratio (should be >99%)
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
\`\`\`

## Performance Tuning

\`\`\`sql
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 64MB
random_page_cost = 1.1  -- for SSD
\`\`\`

## Best Practices

1. **Always use indexes** on WHERE/JOIN columns
2. **Monitor with pg_stat_statements**
3. **Vacuum regularly** to reclaim space
4. **Use connection pooling** in production
5. **Analyze query plans** with EXPLAIN
`,
  },
  {
    id: "react-native-mobile",
    name: "react-native-mobile",
    displayName: "React Native Mobile Development",
    description: "Build cross-platform mobile apps with React Native and Expo.",
    category: "mobile",
    icon: <Smartphone className="w-4 h-4" />,
    installs: 11234,
    tags: ["React Native", "Mobile", "iOS", "Android"],
    skillMd: `---
name: react-native-mobile
description: Cross-platform mobile apps with React Native and Expo for iOS and Android.
---

# React Native Mobile Development

Write once, deploy to iOS and Android.

## Project Setup

\`\`\`bash
# With Expo (recommended)
npx create-expo-app my-app
cd my-app
npm start

# With React Native CLI
npx react-native@latest init MyApp
\`\`\`

## Core Components

\`\`\`jsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hello Mobile!</Text>
      <FlatList
        data={[{id: '1', title: 'Item 1'}]}
        renderItem={({item}) => <Text>{item.title}</Text>}
        keyExtractor={item => item.id}
      />
      <TouchableOpacity onPress={() => alert('Pressed!')}>
        <Text>Press me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
\`\`\`

## Navigation

\`\`\`jsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
\`\`\`

## State Management

\`\`\`jsx
import { create } from 'zustand';

const useStore = create(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));

export default function Counter() {
  const { count, increment } = useStore();
  return <TouchableOpacity onPress={increment}><Text>{count}</Text></TouchableOpacity>;
}
\`\`\`

## API Calls & Async Storage

\`\`\`jsx
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DataScreen() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const cached = await AsyncStorage.getItem('data');
      if (cached) setData(JSON.parse(cached));
      
      const response = await fetch('https://api.example.com/data');
      const json = await response.json();
      setData(json);
      await AsyncStorage.setItem('data', JSON.stringify(json));
    };
    loadData();
  }, []);

  return <Text>{data ? JSON.stringify(data) : 'Loading...'}</Text>;
}
\`\`\`

## Native Modules

- **Camera** — Access device camera
- **Geolocation** — GPS coordinates
- **Permissions** — Request device permissions
- **Push Notifications** — Firebase integration

## Performance Tips

1. Use **FlatList** with \`keyExtractor\` for long lists
2. Use **useMemo** to prevent re-renders
3. Lazy load images with progressive loading
4. Profile with React DevTools Profiler
5. Minimize JavaScript bundle size

## Deployment

- **iOS**: \`eas build --platform ios\`
- **Android**: \`eas build --platform android\`
- Sign and submit to App Store / Play Store

## Best Practices

✅ Use TypeScript for type safety
✅ Optimize FlatList with virtualization
✅ Test on real devices before release
✅ Monitor app performance with Sentry
✅ Use environment-specific configs
`,
  },
  {
    id: "graphql-api-design",
    name: "graphql-api-design",
    displayName: "GraphQL API Design",
    description: "Design efficient GraphQL schemas, resolvers, and real-time subscriptions.",
    category: "development",
    icon: <Network className="w-4 h-4" />,
    installs: 7345,
    tags: ["GraphQL", "API", "Backend"],
    skillMd: `---
name: graphql-api-design
description: Efficient GraphQL schemas, resolvers, subscriptions, and optimization.
---

# GraphQL API Design

Master modern API design with GraphQL.

## Schema Design Best Practices

\`\`\`graphql
type Query {
  user(id: ID!): User
  users(limit: Int!, offset: Int!): UserConnection!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: DateTime!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User
}

input CreateUserInput {
  name: String!
  email: String!
}

type Subscription {
  userCreated: User!
}
\`\`\`

## Resolver Implementation

\`\`\`typescript
const resolvers = {
  Query: {
    user: async (_, { id }, { loaders }) => {
      return loaders.user.load(id);
    },
    users: async (_, { limit, offset }, { db }) => {
      const users = await db.users.find().limit(limit).skip(offset);
      return { edges: users.map(u => ({node: u, cursor: btoa(u.id)})), pageInfo: {...} };
    },
  },
  User: {
    posts: async (user, _, { loaders }) => {
      return loaders.postsByUserId.load(user.id);
    },
  },
  Mutation: {
    createUser: async (_, { input }, { db, pubSub }) => {
      const user = await db.users.insert(input);
      pubSub.publish('USER_CREATED', { userCreated: user });
      return user;
    },
  },
};
\`\`\`

## Query Optimization with DataLoader

\`\`\`typescript
import DataLoader from 'dataloader';

// Prevents N+1 queries
const userLoader = new DataLoader(async (userIds) => {
  return db.users.findByIds(userIds);
});

// In resolver
const posts = await postsLoader.loadMany(postIds);
\`\`\`

## Performance & Security

1. **Depth Limiting** — Prevent deeply nested queries
2. **Query Complexity** — Calculate operation cost
3. **Rate Limiting** — Throttle API usage
4. **Persisted Queries** — Pre-compute common queries
5. **Field Authorization** — Check permissions per field

\`\`\`typescript
function validateQueryComplexity(query, schema) {
  let complexity = 0;
  // Traverse AST and sum field complexities
  return complexity <= MAX_COMPLEXITY;
}
\`\`\`

## Real-Time with Subscriptions

\`\`\`typescript
Subscription: {
  userCreated: {
    subscribe: (_, __, { pubSub }) => {
      return pubSub.asyncIterator(['USER_CREATED']);
    },
  },
}
\`\`\`

## Error Handling

\`\`\`typescript
throw new GraphQLError('User not found', {
  extensions: { code: 'NOT_FOUND', userId: id }
});
\`\`\`

## Best Practices

✅ Use meaningful field names
✅ Mark required fields with \`!\`
✅ Implement cursor-based pagination
✅ Use DataLoader for batching
✅ Deprecate gracefully, never remove fields
✅ Monitor query performance
`,
  },
  {
    id: "aws-infrastructure",
    name: "aws-infrastructure",
    displayName: "AWS Infrastructure as Code",
    description: "Terraform, CloudFormation, and AWS CDK for scalable cloud architecture.",
    category: "devops",
    icon: <Cloud className="w-4 h-4" />,
    installs: 13456,
    tags: ["AWS", "IaC", "Terraform"],
    skillMd: `---
name: aws-infrastructure
description: AWS infrastructure as code with Terraform, CloudFormation, and CDK.
---

# AWS Infrastructure as Code

Build scalable, reproducible cloud infrastructure.

## Terraform Fundamentals

\`\`\`hcl
# Provider configuration
provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = { Name = "main-vpc" }
}

# Subnet
resource "aws_subnet" "main" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

# EC2 Instance
resource "aws_instance" "app" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.main.id

  tags = { Name = "app-server" }
}
\`\`\`

## RDS Database

\`\`\`hcl
resource "aws_db_instance" "postgres" {
  identifier           = "my-database"
  engine              = "postgres"
  engine_version      = "14.7"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = "admin"
  password            = random_password.db.result
  skip_final_snapshot = true

  tags = { Name = "postgres-db" }
}

resource "random_password" "db" {
  length  = 32
  special = true
}
\`\`\`

## Auto-Scaling Group

\`\`\`hcl
resource "aws_launch_template" "app" {
  image_id = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}

resource "aws_autoscaling_group" "app" {
  name              = "app-asg"
  min_size          = 2
  max_size          = 5
  desired_capacity  = 3
  vpc_zone_identifier = [aws_subnet.main.id]
  launch_template {
    id      = aws_launch_template.app.id
    version = "\$Latest"
  }
}
\`\`\`

## S3 Bucket

\`\`\`hcl
resource "aws_s3_bucket" "assets" {
  bucket = "my-app-assets-\${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
\`\`\`

## CloudFront CDN

\`\`\`hcl
resource "aws_cloudfront_distribution" "cdn" {
  enabled = true
  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "s3"
  }
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3"
    forwarded_values {
      query_string = false
    }
    viewer_protocol_policy = "redirect-to-https"
  }
}
\`\`\`

## Variables & Outputs

\`\`\`hcl
variable "environment" {
  type    = string
  default = "production"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

output "instance_ip" {
  value = aws_instance.app.public_ip
}

output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
\`\`\`

## Best Practices

1. **State Management** — Use S3 with locking (DynamoDB)
2. **Workspaces** — Separate dev/staging/prod
3. **Modules** — Reusable infrastructure components
4. **Variables** — Externalize configuration
5. **Documentation** — Add descriptions to resources
6. **Tagging** — Consistent resource labeling

\`\`\`hcl
# terraform.tfvars
environment  = "production"
instance_type = "t3.small"
region       = "us-west-2"

# State backend
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}
\`\`\`

## Common Commands

\`\`\`bash
terraform init        # Initialize
terraform plan        # Preview changes
terraform apply       # Deploy
terraform destroy     # Teardown
terraform state list  # View state
terraform fmt         # Format code
\`\`\`

## AWS CDK (Alternative)

- Write infrastructure in Python/TypeScript
- Synthesizes to CloudFormation templates
- Better type safety than CloudFormation
- Perfect for complex applications
`,
  },
  {
    id: "vue-ecosystem",
    name: "vue-ecosystem",
    displayName: "Vue 3 & Ecosystem",
    description: "Vue 3 composition API, Nuxt, state management, and tooling.",
    category: "web-development",
    icon: <Code2 className="w-4 h-4" />,
    installs: 6543,
    tags: ["Vue", "Nuxt", "Frontend"],
    skillMd: `---
name: vue-ecosystem
description: Vue 3 and modern Vue ecosystem.
---
# Vue 3`,
  },
  {
    id: "svelte-performance",
    name: "svelte-performance",
    displayName: "Svelte & SvelteKit Performance",
    description: "Build fast, reactive web apps with Svelte and optimize bundle size.",
    category: "web-development",
    icon: <Zap className="w-4 h-4" />,
    installs: 5432,
    tags: ["Svelte", "SvelteKit", "Performance"],
    skillMd: `---
name: svelte-performance
description: Svelte high-performance web development.
---
# Svelte`,
  },
  {
    id: "web3-blockchain",
    name: "web3-blockchain",
    displayName: "Web3 & Blockchain Development",
    description: "Smart contracts, dApps, and blockchain integration with Solidity and Web3.js.",
    category: "development",
    icon: <Sparkles className="w-4 h-4" />,
    installs: 4567,
    tags: ["Web3", "Blockchain", "Solidity"],
    skillMd: `---
name: web3-blockchain
description: Web3 and blockchain development.
---
# Web3`,
  },
  {
    id: "testing-strategy",
    name: "testing-strategy",
    displayName: "Comprehensive Testing Strategy",
    description: "Unit, integration, e2e, and performance testing with Vitest, Jest, Cypress, and Playwright.",
    category: "testing",
    icon: <TestTube className="w-4 h-4" />,
    installs: 9876,
    tags: ["Testing", "QA", "Jest", "Cypress"],
    skillMd: `---
name: testing-strategy
description: Comprehensive testing patterns and strategies.
---
# Testing`,
  },
  {
    id: "css-mastery",
    name: "css-mastery",
    displayName: "Advanced CSS & Animations",
    description: "CSS Grid, Flexbox, animations, and modern CSS features for pixel-perfect UIs.",
    category: "web-development",
    icon: <Palette className="w-4 h-4" />,
    installs: 8765,
    tags: ["CSS", "Design", "Animations"],
    skillMd: `---
name: css-mastery
description: Advanced CSS, Grid, and animations.
---
# CSS Mastery`,
  },
  {
    id: "accessibility-wcag",
    name: "accessibility-wcag",
    displayName: "Web Accessibility (WCAG 2.1)",
    description: "Build inclusive web apps with proper ARIA, semantic HTML, and accessibility auditing.",
    category: "web-development",
    icon: <Users className="w-4 h-4" />,
    installs: 7654,
    tags: ["Accessibility", "WCAG", "ARIA"],
    skillMd: `---
name: accessibility-wcag
description: Web accessibility and WCAG compliance.
---
# Accessibility`,
  },
  {
    id: "performance-monitoring",
    name: "performance-monitoring",
    displayName: "Performance Monitoring & Observability",
    description: "Sentry, DataDog, New Relic, and real-user monitoring (RUM) for production apps.",
    category: "devops",
    icon: <TrendingUp className="w-4 h-4" />,
    installs: 8234,
    tags: ["Monitoring", "Observability", "Sentry"],
    skillMd: `---
name: performance-monitoring
description: Production monitoring and observability.
---
# Monitoring`,
  },
  {
    id: "docker-containerization",
    name: "docker-containerization",
    displayName: "Docker & Containerization",
    description: "Docker images, multi-stage builds, Docker Compose, and container best practices.",
    category: "devops",
    icon: <Package className="w-4 h-4" />,
    installs: 10234,
    tags: ["Docker", "Containers", "DevOps"],
    skillMd: `---
name: docker-containerization
description: Docker and containerization.
---
# Docker`,
  },
  {
    id: "ci-cd-pipelines",
    name: "ci-cd-pipelines",
    displayName: "CI/CD Pipelines & Automation",
    description: "GitHub Actions, GitLab CI, Jenkins, and automated deployment workflows.",
    category: "devops",
    icon: <GitBranch className="w-4 h-4" />,
    installs: 11234,
    tags: ["CI/CD", "Automation", "GitHub Actions"],
    skillMd: `---
name: ci-cd-pipelines
description: CI/CD pipelines and automation.
---
# CI/CD`,
  },
  {
    id: "linux-shell-scripting",
    name: "linux-shell-scripting",
    displayName: "Linux & Shell Scripting",
    description: "Bash, Zsh, system administration, and shell automation for DevOps.",
    category: "devops",
    icon: <Terminal className="w-4 h-4" />,
    installs: 6543,
    tags: ["Linux", "Bash", "Shell"],
    skillMd: `---
name: linux-shell-scripting
description: Linux and shell scripting.
---
# Shell`,
  },
  {
    id: "machine-learning-ops",
    name: "machine-learning-ops",
    displayName: "MLOps & Model Deployment",
    description: "ML model training, evaluation, deployment with MLflow, DVC, and TensorFlow Serving.",
    category: "data",
    icon: <Microscope className="w-4 h-4" />,
    installs: 5234,
    tags: ["MLOps", "ML", "Deployment"],
    skillMd: `---
name: machine-learning-ops
description: MLOps and model deployment.
---
# MLOps`,
  },
  {
    id: "prompt-engineering-advanced",
    name: "prompt-engineering-advanced",
    displayName: "Advanced Prompt Engineering",
    description: "Prompt injection prevention, few-shot learning, chain-of-thought, and prompt optimization.",
    category: "ai-engineering",
    icon: <Brain className="w-4 h-4" />,
    installs: 9876,
    tags: ["Prompts", "LLM", "AI"],
    skillMd: `---
name: prompt-engineering-advanced
description: Advanced prompt engineering techniques.
---
# Advanced Prompts`,
  },
  {
    id: "rag-production",
    name: "rag-production",
    displayName: "RAG Systems at Scale",
    description: "Retrieval-augmented generation, vector databases, and production RAG pipelines.",
    category: "ai-engineering",
    icon: <Database className="w-4 h-4" />,
    installs: 7654,
    tags: ["RAG", "Vector DB", "LLM"],
    skillMd: `---
name: rag-production
description: Production RAG systems and vector databases.
---
# RAG`,
  },
  {
    id: "image-generation-models",
    name: "image-generation-models",
    displayName: "Image Generation (DALL-E, Midjourney, SD)",
    description: "Generate, edit, and optimize images with modern generative models.",
    category: "ai-engineering",
    icon: <Camera className="w-4 h-4" />,
    installs: 4567,
    tags: ["Image Gen", "AI", "Vision"],
    skillMd: `---
name: image-generation-models
description: Image generation with modern models.
---
# Image Gen`,
  },
  {
    id: "voice-ai-synthesis",
    name: "voice-ai-synthesis",
    displayName: "Voice AI & Text-to-Speech",
    description: "Voice generation, voice cloning, and conversational AI with speech synthesis.",
    category: "ai-engineering",
    icon: <Music className="w-4 h-4" />,
    installs: 3456,
    tags: ["Voice", "TTS", "Audio"],
    skillMd: `---
name: voice-ai-synthesis
description: Voice synthesis and audio AI.
---
# Voice AI`,
  },
  {
    id: "video-generation-editing",
    name: "video-generation-editing",
    displayName: "Video Generation & AI Editing",
    description: "AI video generation, editing automation, and video understanding with modern APIs.",
    category: "ai-engineering",
    icon: <Gamepad2 className="w-4 h-4" />,
    installs: 2345,
    tags: ["Video", "Generation", "AI"],
    skillMd: `---
name: video-generation-editing
description: AI video generation and editing.
---
# Video AI`,
  },
  {
    id: "langchain-framework",
    name: "langchain-framework",
    displayName: "LangChain Framework",
    description: "LangChain agents, chains, and integrations for building LLM applications.",
    category: "ai-engineering",
    icon: <Layers className="w-4 h-4" />,
    installs: 8765,
    tags: ["LangChain", "LLM", "Agents"],
    skillMd: `---
name: langchain-framework
description: LangChain for LLM applications.
---
# LangChain`,
  },
  {
    id: "langgraph-workflows",
    name: "langgraph-workflows",
    displayName: "LangGraph for Complex Workflows",
    description: "Build agentic workflows, state management, and multi-step reasoning with LangGraph.",
    category: "ai-engineering",
    icon: <Workflow className="w-4 h-4" />,
    installs: 6543,
    tags: ["LangGraph", "Workflows", "Agents"],
    skillMd: `---
name: langgraph-workflows
description: Complex workflows with LangGraph.
---
# LangGraph`,
  },
  {
    id: "crewai-multi-agent",
    name: "crewai-multi-agent",
    displayName: "CrewAI Multi-Agent Systems",
    description: "Build autonomous multi-agent teams with CrewAI for complex problem-solving.",
    category: "ai-engineering",
    icon: <Users className="w-4 h-4" />,
    installs: 5432,
    tags: ["CrewAI", "Agents", "Multi-Agent"],
    skillMd: `---
name: crewai-multi-agent
description: Multi-agent systems with CrewAI.
---
# CrewAI`,
  },
  {
    id: "autogen-framework",
    name: "autogen-framework",
    displayName: "Microsoft AutoGen Framework",
    description: "AutoGen for building conversational agents with role-based conversations.",
    category: "ai-engineering",
    icon: <MessageSquare className="w-4 h-4" />,
    installs: 4321,
    tags: ["AutoGen", "Agents", "Conversational"],
    skillMd: `---
name: autogen-framework
description: Conversational agents with AutoGen.
---
# AutoGen`,
  },
  {
    id: "mcp-protocol-servers",
    name: "mcp-protocol-servers",
    displayName: "Model Context Protocol (MCP)",
    description: "Build MCP servers for connecting AI models to external tools and data sources.",
    category: "ai-engineering",
    icon: <Radio className="w-4 h-4" />,
    installs: 3789,
    tags: ["MCP", "Servers", "Integration"],
    skillMd: `---
name: mcp-protocol-servers
description: Model Context Protocol servers.
---
# MCP`,
  },
  {
    id: "api-security-auth",
    name: "api-security-auth",
    displayName: "API Security & Authentication",
    description: "OAuth 2.0, JWT, SAML, CORS, and API authentication best practices.",
    category: "security",
    icon: <Lock className="w-4 h-4" />,
    installs: 8234,
    tags: ["Security", "Auth", "OAuth"],
    skillMd: `---
name: api-security-auth
description: API security and authentication.
---
# API Security`,
  },
  {
    id: "cryptography-encryption",
    name: "cryptography-encryption",
    displayName: "Cryptography & Encryption",
    description: "AES, RSA, hashing, and encryption best practices for application security.",
    category: "security",
    icon: <Lock className="w-4 h-4" />,
    installs: 6234,
    tags: ["Crypto", "Security", "Encryption"],
    skillMd: `---
name: cryptography-encryption
description: Cryptography and encryption.
---
# Crypto`,
  },
  {
    id: "penetration-testing",
    name: "penetration-testing",
    displayName: "Penetration Testing & Ethical Hacking",
    description: "Vulnerability assessment, penetration testing, and security auditing methodologies.",
    category: "security",
    icon: <Shield className="w-4 h-4" />,
    installs: 4567,
    tags: ["Security", "Penetration", "Testing"],
    skillMd: `---
name: penetration-testing
description: Penetration testing and ethical hacking.
---
# Pen Testing`,
  },
  {
    id: "owasp-compliance",
    name: "owasp-compliance",
    displayName: "OWASP & Security Compliance",
    description: "OWASP Top 10, HIPAA, GDPR, and security compliance frameworks.",
    category: "security",
    icon: <Shield className="w-4 h-4" />,
    installs: 5678,
    tags: ["Compliance", "OWASP", "Security"],
    skillMd: `---
name: owasp-compliance
description: OWASP and security compliance.
---
# OWASP`,
  },
  {
    id: "document-parsing-ai",
    name: "document-parsing-ai",
    displayName: "Document Parsing with AI",
    description: "Extract data from PDFs, images, and documents using OCR and vision models.",
    category: "ai-engineering",
    icon: <FileCode className="w-4 h-4" />,
    installs: 3456,
    tags: ["Document", "OCR", "Vision"],
    skillMd: `---
name: document-parsing-ai
description: AI-powered document parsing.
---
# Document AI`,
  },
  {
    id: "semantic-search",
    name: "semantic-search",
    displayName: "Semantic Search & Embeddings",
    description: "Semantic search implementation, embedding models, and similarity matching.",
    category: "ai-engineering",
    icon: <Search className="w-4 h-4" />,
    installs: 4567,
    tags: ["Search", "Embeddings", "Semantic"],
    skillMd: `---
name: semantic-search
description: Semantic search and embeddings.
---
# Semantic Search`,
  },
  {
    id: "real-time-databases",
    name: "real-time-databases",
    displayName: "Real-Time Databases (Firebase, Supabase)",
    description: "Real-time data synchronization, subscriptions, and collaborative features.",
    category: "data",
    icon: <Database className="w-4 h-4" />,
    installs: 7654,
    tags: ["Firebase", "Supabase", "Real-time"],
    skillMd: `---
name: real-time-databases
description: Real-time database systems.
---
# Real-Time DB`,
  },
  {
    id: "redis-caching",
    name: "redis-caching",
    displayName: "Redis Caching & Pub/Sub",
    description: "Redis for caching, session management, and real-time messaging.",
    category: "data",
    icon: <Rocket className="w-4 h-4" />,
    installs: 8765,
    tags: ["Redis", "Cache", "Pub/Sub"],
    skillMd: `---
name: redis-caching
description: Redis caching and messaging.
---
# Redis`,
  },
  {
    id: "mongodb-nosql",
    name: "mongodb-nosql",
    displayName: "MongoDB & NoSQL Design",
    description: "Document databases, schema design, indexing, and NoSQL optimization.",
    category: "data",
    icon: <Database className="w-4 h-4" />,
    installs: 9234,
    tags: ["MongoDB", "NoSQL", "Database"],
    skillMd: `---
name: mongodb-nosql
description: MongoDB and NoSQL design.
---
# MongoDB`,
  },
  {
    id: "elasticsearch-search",
    name: "elasticsearch-search",
    displayName: "Elasticsearch & Full-Text Search",
    description: "Full-text search, analytics, and large-scale search infrastructure.",
    category: "data",
    icon: <Search className="w-4 h-4" />,
    installs: 6543,
    tags: ["Elasticsearch", "Search", "Analytics"],
    skillMd: `---
name: elasticsearch-search
description: Elasticsearch and full-text search.
---
# Elasticsearch`,
  },
  {
    id: "headless-cms-dev",
    name: "headless-cms-dev",
    displayName: "Headless CMS Development",
    description: "Strapi, Contentful, Sanity, and headless content management.",
    category: "web-development",
    icon: <Monitor className="w-4 h-4" />,
    installs: 5432,
    tags: ["CMS", "Headless", "Content"],
    skillMd: `---
name: headless-cms-dev
description: Headless CMS platforms.
---
# Headless CMS`,
  },
  {
    id: "e-commerce-platforms",
    name: "e-commerce-platforms",
    displayName: "E-Commerce Platform Development",
    description: "Shopify, WooCommerce, custom e-commerce solutions, and payment integration.",
    category: "business",
    icon: <Globe className="w-4 h-4" />,
    installs: 4321,
    tags: ["E-Commerce", "Shopify", "Payment"],
    skillMd: `---
name: e-commerce-platforms
description: E-commerce platform development.
---
# E-Commerce`,
  },
  {
    id: "analytics-tracking",
    name: "analytics-tracking",
    displayName: "Analytics & Event Tracking",
    description: "Google Analytics 4, Amplitude, Mixpanel, and event-driven analytics.",
    category: "business",
    icon: <BarChart2 className="w-4 h-4" />,
    installs: 6789,
    tags: ["Analytics", "Tracking", "Events"],
    skillMd: `---
name: analytics-tracking
description: Analytics and event tracking.
---
# Analytics`,
  },
  {
    id: "email-delivery",
    name: "email-delivery",
    displayName: "Email Delivery & Marketing",
    description: "SendGrid, Mailgun, Resend, email template design, and newsletter automation.",
    category: "business",
    icon: <MessageSquare className="w-4 h-4" />,
    installs: 5678,
    tags: ["Email", "SendGrid", "Marketing"],
    skillMd: `---
name: email-delivery
description: Email delivery systems.
---
# Email`,
  },
  {
    id: "payment-processing",
    name: "payment-processing",
    displayName: "Payment Processing & Billing",
    description: "Stripe, PayPal, billing automation, and subscription management.",
    category: "business",
    icon: <TrendingUp className="w-4 h-4" />,
    installs: 7234,
    tags: ["Payment", "Stripe", "Billing"],
    skillMd: `---
name: payment-processing
description: Payment processing systems.
---
# Payments`,
  },
  {
    id: "notification-systems",
    name: "notification-systems",
    displayName: "Notification Systems & Alerts",
    description: "Push notifications, SMS, webhooks, and real-time alerting.",
    category: "business",
    icon: <MessageSquare className="w-4 h-4" />,
    installs: 4567,
    tags: ["Notifications", "Alerts", "Webhooks"],
    skillMd: `---
name: notification-systems
description: Notification systems.
---
# Notifications`,
  },
  {
    id: "internationalization-i18n",
    name: "internationalization-i18n",
    displayName: "Internationalization (i18n)",
    description: "Multi-language support, localization, and global app deployment.",
    category: "web-development",
    icon: <Globe className="w-4 h-4" />,
    installs: 5432,
    tags: ["i18n", "Localization", "Languages"],
    skillMd: `---
name: internationalization-i18n
description: Internationalization and localization.
---
# i18n`,
  },
  {
    id: "seo-technical",
    name: "seo-technical",
    displayName: "Technical SEO & Core Web Vitals",
    description: "Core Web Vitals, schema markup, crawlability, and SEO optimization.",
    category: "web-development",
    icon: <TrendingUp className="w-4 h-4" />,
    installs: 6234,
    tags: ["SEO", "Performance", "Vitals"],
    skillMd: `---
name: seo-technical
description: Technical SEO optimization.
---
# SEO`,
  },
  {
    id: "server-side-rendering",
    name: "server-side-rendering",
    displayName: "Server-Side Rendering (SSR)",
    description: "Next.js, Nuxt, and server-side rendering for performance and SEO.",
    category: "web-development",
    icon: <Server className="w-4 h-4" />,
    installs: 7654,
    tags: ["SSR", "Next.js", "Performance"],
    skillMd: `---
name: server-side-rendering
description: Server-side rendering optimization.
---
# SSR`,
  },
  {
    id: "static-site-generation",
    name: "static-site-generation",
    displayName: "Static Site Generation (SSG)",
    description: "Next.js, Hugo, Gatsby for fast, secure static sites.",
    category: "web-development",
    icon: <Globe className="w-4 h-4" />,
    installs: 5234,
    tags: ["SSG", "Static", "Performance"],
    skillMd: `---
name: static-site-generation
description: Static site generation.
---
# SSG`,
  },
  {
    id: "jamstack-architecture",
    name: "jamstack-architecture",
    displayName: "JAMStack Architecture",
    description: "JavaScript, APIs, Markup for high-performance, secure web apps.",
    category: "web-development",
    icon: <Rocket className="w-4 h-4" />,
    installs: 4567,
    tags: ["JAMStack", "Architecture", "Static"],
    skillMd: `---
name: jamstack-architecture
description: JAMStack architecture patterns.
---
# JAMStack`,
  },
  {
    id: "web-workers-threading",
    name: "web-workers-threading",
    displayName: "Web Workers & Threading",
    description: "Offload compute to web workers for better performance.",
    category: "web-development",
    icon: <Cpu className="w-4 h-4" />,
    installs: 3456,
    tags: ["Web Workers", "Performance", "Threading"],
    skillMd: `---
name: web-workers-threading
description: Web workers for threading.
---
# Web Workers`,
  },
  {
    id: "progressive-web-apps",
    name: "progressive-web-apps",
    displayName: "Progressive Web Apps (PWA)",
    description: "Service workers, offline support, and app-like experiences on web.",
    category: "web-development",
    icon: <Smartphone className="w-4 h-4" />,
    installs: 6543,
    tags: ["PWA", "Offline", "Service Workers"],
    skillMd: `---
name: progressive-web-apps
description: Progressive web apps.
---
# PWA`,
  },
  {
    id: "design-systems",
    name: "design-systems",
    displayName: "Design Systems & Component Libraries",
    description: "Storybook, Figma, and scalable design systems.",
    category: "creative-design",
    icon: <Palette className="w-4 h-4" />,
    installs: 7234,
    tags: ["Design Systems", "Components", "Storybook"],
    skillMd: `---
name: design-systems
description: Design systems and component libraries.
---
# Design Systems`,
  },
  {
    id: "figma-automation",
    name: "figma-automation",
    displayName: "Figma Plugins & Automation",
    description: "Figma API, plugins, and design automation workflows.",
    category: "creative-design",
    icon: <Wand2 className="w-4 h-4" />,
    installs: 4321,
    tags: ["Figma", "Design", "Automation"],
    skillMd: `---
name: figma-automation
description: Figma plugins and automation.
---
# Figma`,
  },
  {
    id: "framer-motion",
    name: "framer-motion",
    displayName: "Framer Motion & Animations",
    description: "Complex animations, gesture handling, and motion design.",
    category: "creative-design",
    icon: <Sparkles className="w-4 h-4" />,
    installs: 6789,
    tags: ["Framer Motion", "Animations", "Motion"],
    skillMd: `---
name: framer-motion
description: Framer Motion animations.
---
# Framer Motion`,
  },
  {
    id: "three-js-3d",
    name: "three-js-3d",
    displayName: "Three.js & 3D Web Graphics",
    description: "3D graphics, WebGL, and interactive 3D experiences on web.",
    category: "creative-design",
    icon: <Gamepad2 className="w-4 h-4" />,
    installs: 3789,
    tags: ["Three.js", "3D", "WebGL"],
    skillMd: `---
name: three-js-3d
description: 3D graphics with Three.js.
---
# Three.js`,
  },
  {
    id: "canvas-webgl",
    name: "canvas-webgl",
    displayName: "Canvas & WebGL Graphics",
    description: "Low-level canvas drawing, WebGL shaders, and custom graphics.",
    category: "creative-design",
    icon: <Palette className="w-4 h-4" />,
    installs: 2890,
    tags: ["Canvas", "WebGL", "Graphics"],
    skillMd: `---
name: canvas-webgl
description: Canvas and WebGL.
---
# Canvas`,
  },
  {
    id: "audio-synthesis",
    name: "audio-synthesis",
    displayName: "Audio Synthesis & Web Audio API",
    description: "Web Audio API, sound design, and interactive audio.",
    category: "creative-design",
    icon: <Music className="w-4 h-4" />,
    installs: 2345,
    tags: ["Audio", "Web Audio", "Synthesis"],
    skillMd: `---
name: audio-synthesis
description: Web Audio API and synthesis.
---
# Audio`,
  },
  {
    id: "game-development",
    name: "game-development",
    displayName: "Web Game Development",
    description: "Phaser, Babylon.js, and web-based game development.",
    category: "creative-design",
    icon: <Gamepad2 className="w-4 h-4" />,
    installs: 3456,
    tags: ["Games", "Phaser", "Development"],
    skillMd: `---
name: game-development
description: Web game development.
---
# Game Dev`,
  },
  {
    id: "data-visualization",
    name: "data-visualization",
    displayName: "Data Visualization (D3, Recharts)",
    description: "D3.js, Recharts, and custom data visualization.",
    category: "creative-design",
    icon: <BarChart2 className="w-4 h-4" />,
    installs: 5678,
    tags: ["Data Viz", "D3", "Recharts"],
    skillMd: `---
name: data-visualization
description: Data visualization libraries.
---
# Data Viz`,
  },
  {
    id: "documentation-gen",
    name: "documentation-gen",
    displayName: "Automated Documentation Generation",
    description: "TypeDoc, JSDoc, Swagger/OpenAPI, and API documentation.",
    category: "productivity",
    icon: <FileCode className="w-4 h-4" />,
    installs: 4567,
    tags: ["Documentation", "TypeDoc", "OpenAPI"],
    skillMd: `---
name: documentation-gen
description: Automated documentation generation.
---
# Documentation`,
  },
  {
    id: "code-generation",
    name: "code-generation",
    displayName: "Code Generation & Scaffolding",
    description: "Plop, Yeoman, and automated code generation templates.",
    category: "productivity",
    icon: <Code2 className="w-4 h-4" />,
    installs: 3789,
    tags: ["Code Gen", "Scaffolding", "Templates"],
    skillMd: `---
name: code-generation
description: Code generation and scaffolding.
---
# Code Gen`,
  },
  {
    id: "git-workflows",
    name: "git-workflows",
    displayName: "Advanced Git Workflows",
    description: "Git flow, rebasing, advanced branching, and collaboration patterns.",
    category: "productivity",
    icon: <GitBranch className="w-4 h-4" />,
    installs: 5678,
    tags: ["Git", "Workflows", "Version Control"],
    skillMd: `---
name: git-workflows
description: Advanced Git workflows.
---
# Git`,
  },
  {
    id: "issue-tracking",
    name: "issue-tracking",
    displayName: "Issue Tracking & Project Management",
    description: "Jira, Linear, GitHub Issues, and agile project management.",
    category: "productivity",
    icon: <BarChart2 className="w-4 h-4" />,
    installs: 4321,
    tags: ["Jira", "Linear", "Project Management"],
    skillMd: `---
name: issue-tracking
description: Issue tracking and project management.
---
# Issue Tracking`,
  },
  {
    id: "logging-debugging",
    name: "logging-debugging",
    displayName: "Logging & Advanced Debugging",
    description: "Winston, Bunyan, error tracking, and debugging strategies.",
    category: "development",
    icon: <Bug className="w-4 h-4" />,
    installs: 5234,
    tags: ["Logging", "Debugging", "Sentry"],
    skillMd: `---
name: logging-debugging
description: Logging and debugging.
---
# Logging`,
  },
  {
    id: "code-quality-linting",
    name: "code-quality-linting",
    displayName: "Code Quality & Linting",
    description: "ESLint, Prettier, SonarQube, and code quality standards.",
    category: "development",
    icon: <Sparkles className="w-4 h-4" />,
    installs: 6789,
    tags: ["ESLint", "Prettier", "Quality"],
    skillMd: `---
name: code-quality-linting
description: Code quality and linting.
---
# Linting`,
  },
  {
    id: "dependency-management",
    name: "dependency-management",
    displayName: "Dependency Management & Security",
    description: "NPM, Yarn, Pnpm, and dependency vulnerability scanning.",
    category: "development",
    icon: <Package className="w-4 h-4" />,
    installs: 4567,
    tags: ["Dependencies", "NPM", "Security"],
    skillMd: `---
name: dependency-management
description: Dependency management and security.
---
# Dependencies`,
  },
  {
    id: "bundle-analysis",
    name: "bundle-analysis",
    displayName: "Bundle Analysis & Optimization",
    description: "Webpack, Rollup, Vite, and bundle size optimization.",
    category: "development",
    icon: <Cpu className="w-4 h-4" />,
    installs: 5678,
    tags: ["Webpack", "Bundlers", "Optimization"],
    skillMd: `---
name: bundle-analysis
description: Bundle analysis and optimization.
---
# Bundlers`,
  },
  {
    id: "monorepo-management",
    name: "monorepo-management",
    displayName: "Monorepo Management (Nx, Turbo)",
    description: "Nx, Turborepo, and monorepo architecture patterns.",
    category: "development",
    icon: <Layers className="w-4 h-4" />,
    installs: 4789,
    tags: ["Monorepo", "Nx", "Turborepo"],
    skillMd: `---
name: monorepo-management
description: Monorepo management tools.
---
# Monorepo`,
  },
  {
    id: "swagger-openapi",
    name: "swagger-openapi",
    displayName: "Swagger & OpenAPI Standards",
    description: "OpenAPI specification and Swagger documentation.",
    category: "development",
    icon: <FileCode className="w-4 h-4" />,
    installs: 4234,
    tags: ["OpenAPI", "Swagger", "API Docs"],
    skillMd: `---
name: swagger-openapi
description: OpenAPI and Swagger.
---
# OpenAPI`,
  },
  {
    id: "streaming-real-time",
    name: "streaming-real-time",
    displayName: "Streaming & Real-Time Architecture",
    description: "WebSockets, Server-Sent Events, and real-time streaming.",
    category: "development",
    icon: <Radio className="w-4 h-4" />,
    installs: 3456,
    tags: ["Streaming", "WebSocket", "Real-time"],
    skillMd: `---
name: streaming-real-time
description: Real-time streaming architecture.
---
# Streaming`,
  },
  {
    id: "api-rate-limiting",
    name: "api-rate-limiting",
    displayName: "API Rate Limiting & Throttling",
    description: "Rate limiting strategies, token buckets, and throttling.",
    category: "development",
    icon: <Zap className="w-4 h-4" />,
    installs: 3789,
    tags: ["Rate Limit", "API", "Performance"],
    skillMd: `---
name: api-rate-limiting
description: Rate limiting strategies.
---
# Rate Limiting`,
  },
  {
    id: "caching-strategies",
    name: "caching-strategies",
    displayName: "Caching Strategies & CDN",
    description: "HTTP caching, browser caching, and CDN optimization.",
    category: "development",
    icon: <Rocket className="w-4 h-4" />,
    installs: 4567,
    tags: ["Caching", "CDN", "Performance"],
    skillMd: `---
name: caching-strategies
description: Caching strategies and CDN.
---
# Caching`,
  },
  {
    id: "load-balancing",
    name: "load-balancing",
    displayName: "Load Balancing & Scalability",
    description: "Load balancing algorithms, horizontal scaling, and infrastructure design.",
    category: "devops",
    icon: <Network className="w-4 h-4" />,
    installs: 3234,
    tags: ["Load Balancing", "Scaling", "Infrastructure"],
    skillMd: `---
name: load-balancing
description: Load balancing and scalability.
---
# Load Balancing`,
  },
  {
    id: "disaster-recovery",
    name: "disaster-recovery",
    displayName: "Disaster Recovery & Backup",
    description: "Backup strategies, failover, and disaster recovery planning.",
    category: "devops",
    icon: <Server className="w-4 h-4" />,
    installs: 2567,
    tags: ["Disaster Recovery", "Backup", "HA"],
    skillMd: `---
name: disaster-recovery
description: Disaster recovery planning.
---
# DR`,
  },
  {
    id: "infrastructure-provisioning",
    name: "infrastructure-provisioning",
    displayName: "Infrastructure Provisioning",
    description: "Terraform, Ansible, and cloud infrastructure automation.",
    category: "devops",
    icon: <Cloud className="w-4 h-4" />,
    installs: 5234,
    tags: ["Terraform", "Ansible", "IaC"],
    skillMd: `---
name: infrastructure-provisioning
description: Infrastructure provisioning.
---
# Provisioning`,
  },
  {
    id: "secrets-management",
    name: "secrets-management",
    displayName: "Secrets Management & Vaults",
    description: "Vault, environment variables, and secure secret storage.",
    category: "security",
    icon: <Lock className="w-4 h-4" />,
    installs: 4678,
    tags: ["Secrets", "Vault", "Security"],
    skillMd: `---
name: secrets-management
description: Secrets management.
---
# Secrets`,
  },
  {
    id: "network-security",
    name: "network-security",
    displayName: "Network Security & Firewalls",
    description: "Firewalls, VPNs, WAF, and network architecture security.",
    category: "security",
    icon: <Shield className="w-4 h-4" />,
    installs: 3456,
    tags: ["Network", "Firewall", "Security"],
    skillMd: `---
name: network-security
description: Network security.
---
# Network Security`,
  },
  {
    id: "content-security-policy",
    name: "content-security-policy",
    displayName: "Content Security Policy (CSP)",
    description: "CSP implementation, XSS prevention, and browser security headers.",
    category: "security",
    icon: <Shield className="w-4 h-4" />,
    installs: 3789,
    tags: ["CSP", "Security", "XSS"],
    skillMd: `---
name: content-security-policy
description: Content Security Policy.
---
# CSP`,
  },
  {
    id: "dependency-injection",
    name: "dependency-injection",
    displayName: "Dependency Injection Patterns",
    description: "DI containers, service locators, and dependency management.",
    category: "development",
    icon: <Layers className="w-4 h-4" />,
    installs: 3234,
    tags: ["Design Patterns", "DI", "Architecture"],
    skillMd: `---
name: dependency-injection
description: Dependency injection patterns.
---
# DI`,
  },
  {
    id: "state-management-complex",
    name: "state-management-complex",
    displayName: "Advanced State Management",
    description: "Redux, Zustand, Recoil, and complex state patterns.",
    category: "development",
    icon: <Brain className="w-4 h-4" />,
    installs: 5678,
    tags: ["State", "Redux", "Zustand"],
    skillMd: `---
name: state-management-complex
description: Advanced state management.
---
# State Management`,
  },
  {
    id: "design-patterns",
    name: "design-patterns",
    displayName: "Software Design Patterns",
    description: "Factory, Observer, Strategy, and classic design patterns.",
    category: "development",
    icon: <Sparkles className="w-4 h-4" />,
    installs: 4567,
    tags: ["Design Patterns", "Architecture"],
    skillMd: `---
name: design-patterns
description: Software design patterns.
---
# Design Patterns`,
  },
  {
    id: "clean-architecture",
    name: "clean-architecture",
    displayName: "Clean Architecture & SOLID",
    description: "Clean architecture principles, SOLID, and code organization.",
    category: "development",
    icon: <Code2 className="w-4 h-4" />,
    installs: 5234,
    tags: ["Architecture", "SOLID", "Clean Code"],
    skillMd: `---
name: clean-architecture
description: Clean architecture principles.
---
# Clean Architecture`,
  },
  {
    id: "event-driven-architecture",
    name: "event-driven-architecture",
    displayName: "Event-Driven Architecture",
    description: "Event sourcing, CQRS, and event-driven systems.",
    category: "development",
    icon: <Radio className="w-4 h-4" />,
    installs: 4123,
    tags: ["Events", "CQRS", "Architecture"],
    skillMd: `---
name: event-driven-architecture
description: Event-driven architecture.
---
# Event-Driven`,
  },
  {
    id: "microservices-patterns",
    name: "microservices-patterns",
    displayName: "Microservices Architecture Patterns",
    description: "Service mesh, API gateway, and microservices design patterns.",
    category: "development",
    icon: <Network className="w-4 h-4" />,
    installs: 5789,
    tags: ["Microservices", "Architecture", "API Gateway"],
    skillMd: `---
name: microservices-patterns
description: Microservices patterns.
---
# Microservices`,
  },
  {
    id: "api-versioning",
    name: "api-versioning",
    displayName: "API Versioning & Evolution",
    description: "API versioning strategies and backward compatibility.",
    category: "development",
    icon: <GitBranch className="w-4 h-4" />,
    installs: 3456,
    tags: ["API", "Versioning", "Evolution"],
    skillMd: `---
name: api-versioning
description: API versioning strategies.
---
# API Versioning`,
  },
  {
    id: "database-sharding",
    name: "database-sharding",
    displayName: "Database Sharding & Replication",
    description: "Database sharding, replication, and distributed data.",
    category: "data",
    icon: <Database className="w-4 h-4" />,
    installs: 3234,
    tags: ["Database", "Sharding", "Replication"],
    skillMd: `---
name: database-sharding
description: Database sharding and replication.
---
# Sharding`,
  },
  {
    id: "search-optimization",
    name: "search-optimization",
    displayName: "Search & Query Optimization",
    description: "Query optimization, index strategies, and search performance.",
    category: "data",
    icon: <Zap className="w-4 h-4" />,
    installs: 3789,
    tags: ["Search", "Optimization", "Queries"],
    skillMd: `---
name: search-optimization
description: Search and query optimization.
---
# Search Optimization`,
  },
  {
    id: "data-pipeline-etl",
    name: "data-pipeline-etl",
    displayName: "Data Pipelines & ETL",
    description: "Data pipelines, ETL processes, and data workflows.",
    category: "data",
    icon: <Workflow className="w-4 h-4" />,
    installs: 4567,
    tags: ["ETL", "Data Pipeline", "Workflow"],
    skillMd: `---
name: data-pipeline-etl
description: Data pipelines and ETL.
---
# ETL`,
  },
  {
    id: "time-series-databases",
    name: "time-series-databases",
    displayName: "Time-Series Databases & Analytics",
    description: "InfluxDB, TimescaleDB, and time-series data analysis.",
    category: "data",
    icon: <TrendingUp className="w-4 h-4" />,
    installs: 3234,
    tags: ["Time Series", "Analytics", "InfluxDB"],
    skillMd: `---
name: time-series-databases
description: Time-series databases.
---
# Time Series`,
  },
  {
    id: "graph-databases",
    name: "graph-databases",
    displayName: "Graph Databases & Neo4j",
    description: "Neo4j, graph queries, and relationship data modeling.",
    category: "data",
    icon: <Network className="w-4 h-4" />,
    installs: 2890,
    tags: ["Graph DB", "Neo4j", "Relationships"],
    skillMd: `---
name: graph-databases
description: Graph databases.
---
# Graph DB`,
  },
  {
    id: "mobile-ios-development",
    name: "mobile-ios-development",
    displayName: "iOS Development with Swift",
    description: "Swift, SwiftUI, and native iOS app development.",
    category: "mobile",
    icon: <Smartphone className="w-4 h-4" />,
    installs: 4567,
    tags: ["iOS", "Swift", "SwiftUI"],
    skillMd: `---
name: mobile-ios-development
description: iOS development with Swift.
---
# iOS`,
  },
  {
    id: "mobile-android-development",
    name: "mobile-android-development",
    displayName: "Android Development with Kotlin",
    description: "Kotlin, Jetpack, and native Android app development.",
    category: "mobile",
    icon: <Smartphone className="w-4 h-4" />,
    installs: 4234,
    tags: ["Android", "Kotlin", "Jetpack"],
    skillMd: `---
name: mobile-android-development
description: Android development with Kotlin.
---
# Android`,
  },
  {
    id: "mobile-cross-platform",
    name: "mobile-cross-platform",
    displayName: "Cross-Platform Mobile (Flutter)",
    description: "Flutter, Dart, and cross-platform mobile development.",
    category: "mobile",
    icon: <Smartphone className="w-4 h-4" />,
    installs: 3789,
    tags: ["Flutter", "Dart", "Cross-platform"],
    skillMd: `---
name: mobile-cross-platform
description: Cross-platform with Flutter.
---
# Flutter`,
  },
  {
    id: "mobile-testing",
    name: "mobile-testing",
    displayName: "Mobile App Testing",
    description: "Mobile testing strategies, Appium, and device testing.",
    category: "testing",
    icon: <TestTube className="w-4 h-4" />,
    installs: 2567,
    tags: ["Mobile Testing", "Appium", "QA"],
    skillMd: `---
name: mobile-testing
description: Mobile app testing.
---
# Mobile Testing`,
  },
  {
    id: "performance-optimization",
    name: "performance-optimization",
    displayName: "Performance Optimization & Profiling",
    description: "Profiling, optimization, and performance debugging.",
    category: "development",
    icon: <Rocket className="w-4 h-4" />,
    installs: 5678,
    tags: ["Performance", "Profiling", "Optimization"],
    skillMd: `---
name: performance-optimization
description: Performance optimization.
---
# Performance`,
  },
  {
    id: "memory-management",
    name: "memory-management",
    displayName: "Memory Management & Garbage Collection",
    description: "Memory leaks, garbage collection, and memory optimization.",
    category: "development",
    icon: <Cpu className="w-4 h-4" />,
    installs: 3456,
    tags: ["Memory", "GC", "Optimization"],
    skillMd: `---
name: memory-management
description: Memory management.
---
# Memory`,
  },
  {
    id: "cpu-optimization",
    name: "cpu-optimization",
    displayName: "CPU & Algorithm Optimization",
    description: "Algorithm optimization, big-O analysis, and CPU profiling.",
    category: "development",
    icon: <Zap className="w-4 h-4" />,
    installs: 3789,
    tags: ["Algorithms", "Performance", "CPU"],
    skillMd: `---
name: cpu-optimization
description: CPU and algorithm optimization.
---
# CPU Optimization`,
  },
  {
    id: "concurrent-programming",
    name: "concurrent-programming",
    displayName: "Concurrent & Parallel Programming",
    description: "Threads, async/await, and concurrent system design.",
    category: "development",
    icon: <Layers className="w-4 h-4" />,
    installs: 4234,
    tags: ["Concurrency", "Async", "Parallel"],
    skillMd: `---
name: concurrent-programming
description: Concurrent programming patterns.
---
# Concurrency`,
  },
  {
    id: "edge-computing",
    name: "edge-computing",
    displayName: "Edge Computing & CDN Functions",
    description: "Cloudflare Workers, Vercel Edge Functions, and edge computing.",
    category: "devops",
    icon: <Cloud className="w-4 h-4" />,
    installs: 3567,
    tags: ["Edge", "Workers", "Serverless"],
    skillMd: `---
name: edge-computing
description: Edge computing platforms.
---
# Edge`,
  },
  {
    id: "serverless-architecture",
    name: "serverless-architecture",
    displayName: "Serverless Architecture (AWS Lambda, GCP Functions)",
    description: "Serverless functions, event-driven computing, and Function-as-a-Service.",
    category: "devops",
    icon: <Cloud className="w-4 h-4" />,
    installs: 5789,
    tags: ["Serverless", "Lambda", "FaaS"],
    skillMd: `---
name: serverless-architecture
description: Serverless architecture.
---
# Serverless`,
  },
  {
    id: "distributed-systems",
    name: "distributed-systems",
    displayName: "Distributed Systems Design",
    description: "Consensus algorithms, distributed transactions, and fault tolerance.",
    category: "development",
    icon: <Network className="w-4 h-4" />,
    installs: 2890,
    tags: ["Distributed", "Systems", "Consensus"],
    skillMd: `---
name: distributed-systems
description: Distributed systems design.
---
# Distributed Systems`,
  },
  {
    id: "consistency-models",
    name: "consistency-models",
    displayName: "Consistency Models & CAP Theorem",
    description: "CAP theorem, eventual consistency, and consistency guarantees.",
    category: "development",
    icon: <Brain className="w-4 h-4" />,
    installs: 2345,
    tags: ["Consistency", "CAP", "Theory"],
    skillMd: `---
name: consistency-models
description: Consistency models.
---
# Consistency`,
  },
  {
    id: "financial-software",
    name: "financial-software",
    displayName: "Financial Software & Compliance",
    description: "FinTech, compliance, PCI-DSS, and financial data handling.",
    category: "business",
    icon: <TrendingUp className="w-4 h-4" />,
    installs: 2345,
    tags: ["FinTech", "Compliance", "Banking"],
    skillMd: `---
name: financial-software
description: Financial software development.
---
# FinTech`,
  },
  {
    id: "healthcare-compliance",
    name: "healthcare-compliance",
    displayName: "Healthcare Software & HIPAA",
    description: "HIPAA compliance, PHI handling, and healthcare data security.",
    category: "business",
    icon: <Shield className="w-4 h-4" />,
    installs: 1890,
    tags: ["Healthcare", "HIPAA", "Compliance"],
    skillMd: `---
name: healthcare-compliance
description: Healthcare compliance.
---
# Healthcare`,
  },
  {
    id: "saas-architecture",
    name: "saas-architecture",
    displayName: "SaaS Architecture & Multi-Tenancy",
    description: "Multi-tenant systems, subscription management, and SaaS design.",
    category: "business",
    icon: <Layers className="w-4 h-4" />,
    installs: 4567,
    tags: ["SaaS", "Multi-tenant", "Subscriptions"],
    skillMd: `---
name: saas-architecture
description: SaaS architecture.
---
# SaaS`,
  },
  {
    id: "growth-analytics",
    name: "growth-analytics",
    displayName: "Growth Analytics & Product Metrics",
    description: "Cohort analysis, retention, funnel analysis, and product metrics.",
    category: "business",
    icon: <BarChart2 className="w-4 h-4" />,
    installs: 3456,
    tags: ["Analytics", "Growth", "Metrics"],
    skillMd: `---
name: growth-analytics
description: Growth analytics.
---
# Growth`,
  },
  {
    id: "ab-testing",
    name: "ab-testing",
    displayName: "A/B Testing & Experimentation",
    description: "Statistical testing, experiment design, and A/B testing frameworks.",
    category: "business",
    icon: <FlaskConical className="w-4 h-4" />,
    installs: 3789,
    tags: ["A/B Testing", "Experiments", "Statistics"],
    skillMd: `---
name: ab-testing
description: A/B testing and experimentation.
---
# A/B Testing`,
  },
  {
    id: "user-research",
    name: "user-research",
    displayName: "User Research & User Testing",
    description: "User interviews, usability testing, and qualitative research.",
    category: "business",
    icon: <Users className="w-4 h-4" />,
    installs: 2567,
    tags: ["UX Research", "User Testing", "Interviews"],
    skillMd: `---
name: user-research
description: User research methods.
---
# User Research`,
  },
  {
    id: "conversion-optimization",
    name: "conversion-optimization",
    displayName: "Conversion Rate Optimization",
    description: "CRO, funnel optimization, and conversion rate strategies.",
    category: "business",
    icon: <TrendingUp className="w-4 h-4" />,
    installs: 3234,
    tags: ["CRO", "Optimization", "Conversion"],
    skillMd: `---
name: conversion-optimization
description: Conversion rate optimization.
---
# CRO`,
  },
  {
    id: "product-strategy",
    name: "product-strategy",
    displayName: "Product Strategy & Roadmapping",
    description: "Product management, roadmapping, and strategic planning.",
    category: "business",
    icon: <BarChart2 className="w-4 h-4" />,
    installs: 2890,
    tags: ["Product", "Strategy", "Roadmap"],
    skillMd: `---
name: product-strategy
description: Product strategy.
---
# Product Strategy`,
  },
  {
    id: "team-leadership",
    name: "team-leadership",
    displayName: "Technical Team Leadership",
    description: "Team management, mentoring, and technical leadership.",
    category: "business",
    icon: <Users className="w-4 h-4" />,
    installs: 2345,
    tags: ["Leadership", "Team", "Management"],
    skillMd: `---
name: team-leadership
description: Technical leadership.
---
# Leadership`,
  },
  {
    id: "open-source-contrib",
    name: "open-source-contrib",
    displayName: "Open Source Contribution",
    description: "Contributing to open source projects and community engagement.",
    category: "productivity",
    icon: <GitBranch className="w-4 h-4" />,
    installs: 2567,
    tags: ["Open Source", "Community", "Contributing"],
    skillMd: `---
name: open-source-contrib
description: Open source contribution.
---
# Open Source`,
  },
  {
    id: "writing-technical",
    name: "writing-technical",
    displayName: "Technical Writing & Blogging",
    description: "Technical documentation, blog writing, and knowledge sharing.",
    category: "productivity",
    icon: <FileCode className="w-4 h-4" />,
    installs: 2890,
    tags: ["Writing", "Blog", "Documentation"],
    skillMd: `---
name: writing-technical
description: Technical writing.
---
# Writing`,
  },
  {
    id: "public-speaking",
    name: "public-speaking",
    displayName: "Public Speaking & Presentations",
    description: "Conference talks, technical presentations, and public communication.",
    category: "productivity",
    icon: <MessageSquare className="w-4 h-4" />,
    installs: 1890,
    tags: ["Speaking", "Presentations", "Communication"],
    skillMd: `---
name: public-speaking
description: Public speaking skills.
---
# Speaking`,
  },
  {
    id: "code-archaeology",
    name: "code-archaeology",
    displayName: "Code Archaeology & Refactoring",
    description: "Understanding legacy code, refactoring, and code modernization.",
    category: "productivity",
    icon: <Bug className="w-4 h-4" />,
    installs: 2234,
    tags: ["Refactoring", "Legacy Code", "Modernization"],
    skillMd: `---
name: code-archaeology
description: Code archaeology and refactoring.
---
# Archaeology`,
  },
  {
    id: "system-design-interview",
    name: "system-design-interview",
    displayName: "System Design Interview Prep",
    description: "System design interview patterns, case studies, and preparation.",
    category: "productivity",
    icon: <Brain className="w-4 h-4" />,
    installs: 3567,
    tags: ["Interview", "System Design", "Prep"],
    skillMd: `---
name: system-design-interview
description: System design interviews.
---
# System Design`,
  },
  {
    id: "leetcode-dsa",
    name: "leetcode-dsa",
    displayName: "Data Structures & Algorithms",
    description: "DSA fundamentals, problem-solving, and algorithmic thinking.",
    category: "development",
    icon: <Code2 className="w-4 h-4" />,
    installs: 4234,
    tags: ["DSA", "Algorithms", "Data Structures"],
    skillMd: `---
name: leetcode-dsa
description: Data structures and algorithms.
---
# DSA`,
  },
  {
    id: "quantum-computing",
    name: "quantum-computing",
    displayName: "Quantum Computing Fundamentals",
    description: "Quantum computing basics, quantum gates, and QVM programming.",
    category: "development",
    icon: <Cpu className="w-4 h-4" />,
    installs: 567,
    tags: ["Quantum", "Computing", "QVM"],
    skillMd: `---
name: quantum-computing
description: Quantum computing fundamentals.
---
# Quantum`,
  },
  {
    id: "hardware-iot",
    name: "hardware-iot",
    displayName: "Hardware & IoT Development",
    description: "Arduino, Raspberry Pi, and Internet of Things development.",
    category: "development",
    icon: <Smartphone className="w-4 h-4" />,
    installs: 1234,
    tags: ["IoT", "Hardware", "Arduino"],
    skillMd: `---
name: hardware-iot
description: IoT and hardware development.
---
# IoT`,
  },
  {
    id: "robotics-programming",
    name: "robotics-programming",
    displayName: "Robotics Programming",
    description: "ROS, robot control, and robotics system design.",
    category: "development",
    icon: <Bot className="w-4 h-4" />,
    installs: 890,
    tags: ["Robotics", "ROS", "Control"],
    skillMd: `---
name: robotics-programming
description: Robotics programming.
---
# Robotics`,
  },
  {
    id: "satellite-imagery",
    name: "satellite-imagery",
    displayName: "Satellite Imagery & Geospatial",
    description: "Geospatial analysis, satellite data, and mapping.",
    category: "data",
    icon: <Globe className="w-4 h-4" />,
    installs: 567,
    tags: ["Geospatial", "Satellite", "Mapping"],
    skillMd: `---
name: satellite-imagery
description: Geospatial analysis.
---
# Geospatial`,
  },
  {
    id: "bioinformatics",
    name: "bioinformatics",
    displayName: "Bioinformatics & Computational Biology",
    description: "DNA analysis, sequence alignment, and computational biology.",
    category: "data",
    icon: <Microscope className="w-4 h-4" />,
    installs: 345,
    tags: ["Bioinformatics", "Biology", "DNA"],
    skillMd: `---
name: bioinformatics
description: Bioinformatics.
---
# Bioinformatics`,
  },
  {
    id: "neuroscience-ai",
    name: "neuroscience-ai",
    displayName: "Neuroscience & AI/ML",
    description: "Brain-inspired AI, neural networks, and neuroscience.",
    category: "ai-engineering",
    icon: <Brain className="w-4 h-4" />,
    installs: 234,
    tags: ["Neuroscience", "AI", "Neural Networks"],
    skillMd: `---
name: neuroscience-ai
description: Neuroscience and AI.
---
# Neuroscience`,
  },
  {
    id: "physics-simulation",
    name: "physics-simulation",
    displayName: "Physics Simulation & Modeling",
    description: "Physics engines, particle systems, and scientific simulation.",
    category: "development",
    icon: <Zap className="w-4 h-4" />,
    installs: 456,
    tags: ["Physics", "Simulation", "Modeling"],
    skillMd: `---
name: physics-simulation
description: Physics simulation.
---
# Physics`,
  },
  {
    id: "climate-modeling",
    name: "climate-modeling",
    displayName: "Climate Modeling & Environmental Data",
    description: "Climate data analysis, environmental modeling, and sustainability.",
    category: "data",
    icon: <Globe className="w-4 h-4" />,
    installs: 123,
    tags: ["Climate", "Environmental", "Data"],
    skillMd: `---
name: climate-modeling
description: Climate modeling.
---
# Climate`,
  },
  {
    id: "causal-inference",
    name: "causal-inference",
    displayName: "Causal Inference & Statistics",
    description: "Causal graphs, statistical inference, and experimental design.",
    category: "data",
    icon: <Brain className="w-4 h-4" />,
    installs: 234,
    tags: ["Causal", "Statistics", "Inference"],
    skillMd: `---
name: causal-inference
description: Causal inference.
---
# Causal Inference`,
  },
  {
    id: "recommendation-systems",
    name: "recommendation-systems",
    displayName: "Recommendation Systems & Personalization",
    description: "Collaborative filtering, content-based recommendations, and personalization.",
    category: "ai-engineering",
    icon: <Sparkles className="w-4 h-4" />,
    installs: 2345,
    tags: ["Recommendations", "Personalization", "ML"],
    skillMd: `---
name: recommendation-systems
description: Recommendation systems.
---
# Recommendations`,
  },
  {
    id: "anomaly-detection",
    name: "anomaly-detection",
    displayName: "Anomaly Detection & Outlier Analysis",
    description: "Outlier detection, anomaly detection algorithms, and monitoring.",
    category: "ai-engineering",
    icon: <TestTube className="w-4 h-4" />,
    installs: 1567,
    tags: ["Anomaly", "Outlier", "Monitoring"],
    skillMd: `---
name: anomaly-detection
description: Anomaly detection.
---
# Anomaly Detection`,
  },
  {
    id: "natural-language-processing",
    name: "natural-language-processing",
    displayName: "Natural Language Processing (NLP)",
    description: "NLP, text analysis, sentiment analysis, and language models.",
    category: "ai-engineering",
    icon: <MessageSquare className="w-4 h-4" />,
    installs: 3456,
    tags: ["NLP", "Text", "Language"],
    skillMd: `---
name: natural-language-processing
description: Natural language processing.
---
# NLP`,
  },
  {
    id: "computer-vision",
    name: "computer-vision",
    displayName: "Computer Vision & Image Processing",
    description: "Computer vision, object detection, image classification, and segmentation.",
    category: "ai-engineering",
    icon: <Camera className="w-4 h-4" />,
    installs: 2890,
    tags: ["Vision", "CV", "Detection"],
    skillMd: `---
name: computer-vision
description: Computer vision.
---
# CV`,
  },
];

// ── Install instructions component ────────────────────────────────────────────

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
  const [liveSkills, setLiveSkills]   = useState<LiveSkill[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setLiveSkills(d.skills ?? []))
      .catch(() => {})
      .finally(() => setLiveLoading(false));
  }, []);

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

          {/* Live skills from GitHub */}
          {(liveLoading || liveSkills.length > 0) && (
            <div className="px-4 md:px-6 pt-4 pb-2 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE · GitHub Community
                </span>
                <span className="text-[11px] text-gray-600">{liveLoading ? "fetching…" : `${liveSkills.length} repos`}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {liveLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-52 h-24 rounded-xl bg-white/5 animate-pulse" />
                    ))
                  : liveSkills.slice(0, 20).map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-52 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-xl p-3 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img src={s.avatarUrl} alt={s.owner} className="w-5 h-5 rounded-full" />
                          <span className="text-[10px] text-gray-500 truncate">{s.owner}</span>
                          <span className="ml-auto text-[10px] text-amber-400 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5" />{s.stars}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white truncate group-hover:text-violet-300 transition-colors">{s.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>
                        {s.language && (
                          <span className="mt-1.5 inline-block text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{s.language}</span>
                        )}
                      </a>
                    ))}
              </div>
            </div>
          )}

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