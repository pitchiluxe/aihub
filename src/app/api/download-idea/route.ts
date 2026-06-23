import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import type { Idea } from "@/app/(app)/million-ideas/ideas-data";

// ─── Bundled Skill Content ─────────────────────────────────────────────────────
// Key excerpts from AIHub's .claude/skills/ library, bundled into every kit.

const UI_UX_SKILL = `---
name: ui-ux-pro-max
description: UI/UX design intelligence — 50 styles, 21 palettes, accessibility rules, interaction patterns.
---

# UI/UX Pro Max — Design Standards

## Critical Rules (Always Apply)

### Accessibility
- Color contrast minimum 4.5:1 for normal text
- All interactive elements need visible focus rings (focus:ring-2)
- Icon-only buttons need aria-label
- All form inputs need associated <label htmlFor="...">
- Tab order must match visual order

### Interaction & Touch
- Minimum 44×44px touch targets
- Disable buttons during async operations (disabled={loading})
- Show clear loading states (spinner or "Loading...")
- Show success/error feedback after every form submit
- Add cursor-pointer to all clickable elements

### Layout & Responsive
- Mobile-first: start with base styles, add sm: md: lg: breakpoints
- Minimum 16px body text on mobile
- Navigation collapses to hamburger below md:
- Max content width: max-w-6xl mx-auto

### Design Quality
- Alternate section backgrounds (never same background twice in a row)
- Cards: hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300
- Typography: one large hero heading, section headings (text-3xl), body (text-base)
- Consistent section padding: py-16 sm:py-20 px-4 sm:px-6

## Color Palettes (Dark Apps)
- Background: #080c14 (deep navy-black)
- Surface: #0d1421 (card surfaces)
- Border: white/8 to white/12
- Accent: indigo-600 (#4f46e5) with hover:indigo-500
- Muted text: slate-400 to slate-500
- Success: emerald-400 / red-400 for errors

## Anti-Patterns (Never Do)
- No floating gradient orbs or blob backgrounds
- No Lorem ipsum — use realistic content
- No gradient mesh backgrounds
- No particle animations
- No dead href="#" links — use real anchors or button onClick
`;

const REACT_SKILL = `---
name: react-best-practices
description: React patterns for building functional, performant components.
---

# React Best Practices

## State Management
- Use separate useState calls per concern — don't merge unrelated state into one object
- Form status pattern: useState<"idle"|"loading"|"success"|"error">("idle")
- Controlled inputs: value={field} onChange={(e) => setField(e.target.value)}
- Multi-turn chat history: useState<{role,content}[]>([])

## Async Patterns
- Always wrap async ops: setLoading(true) → try/await → setLoading(false) in finally
- Show loading state immediately before the await
- Handle errors in catch, not by checking res.ok inline
- Disable submit buttons during loading: disabled={loading || !input.trim()}

## Performance
- useRef for scroll-to-bottom: ref.current?.scrollIntoView({ behavior: "smooth" })
- useEffect cleanup: return () => clearInterval(id) for timers
- Avoid anonymous functions in JSX for hot paths — extract named handlers

## Patterns to Use
- Mobile menu: const [menuOpen, setMenuOpen] = useState(false)
- FAQ accordion: const [openFaq, setOpenFaq] = useState<number|null>(null)
- Copy to clipboard: await navigator.clipboard.writeText(text)
- Toast/feedback: setTimeout to reset status back to "idle" after 2000ms

## Anti-Patterns (Never Do)
- No direct DOM mutation — use React state
- No useEffect for derived values — compute during render
- No missing dependency arrays in useEffect
- No key={index} when list items can reorder — use stable IDs
`;

const SENIOR_FRONTEND_SKILL = `---
name: senior-frontend
description: Senior frontend patterns for Next.js, TypeScript, Tailwind CSS.
---

# Senior Frontend Standards

## Next.js App Router
- "use client" only when using hooks, event handlers, or browser APIs
- Server components for data fetching — client components for interactivity
- API routes: always validate input, return proper HTTP status codes
- maxDuration = 60 for AI routes that call external APIs

## TypeScript
- Type form status as union: "idle" | "loading" | "success" | "error"
- Type API responses explicitly — don't use any
- Use satisfies for config objects instead of type casting
- Prefer type over interface for simple shapes

## Tailwind CSS
- Use sm: md: lg: breakpoints consistently (mobile-first)
- Prefer gap-4 over mx-2 for spacing between flex/grid children
- transition-all duration-300 for hover effects
- group and group-hover: for child hover effects
- Use tabular-nums for numbers that change (timers, counters)

## Component Patterns
- Extract repeated JSX into named components above the page export
- Colocate all page state at the top of the component, before render helpers
- Event handlers as named functions, not inline arrows for complex logic
- Descriptive variable names: isLoading not l, formStatus not s
`;

// ─── Utility ──────────────────────────────────────────────────────────────────

function skillName(idea: Idea): string {
  return idea.title
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "");
}

// ─── CLAUDE.md ────────────────────────────────────────────────────────────────

function claudeMd(idea: Idea): string {
  return `# ${idea.title} — CLAUDE.md

## Project Overview
**${idea.title}** is an AI-powered ${idea.category} tool.

> ${idea.tagline}

**Problem:** ${idea.problem}

**Solution:** ${idea.solution}

---

## Tech Stack
${idea.techStack.map((t) => `- ${t}`).join("\n")}

## Core Features
${idea.features.map((f) => `- ✅ ${f}`).join("\n")}

---

## Project Structure

\`\`\`
src/
  app/
    page.tsx              # Main UI — hero, input, result display
    layout.tsx            # Root layout with metadata
    globals.css           # Tailwind + CSS variables
    api/
      process/route.ts    # POST /api/process — AI processing endpoint
  lib/
    supabase.ts           # Supabase client
    utils.ts              # cn() utility
supabase/
  schema.sql              # Database schema — run in Supabase SQL editor
.claude/
  SKILLS/${skillName(idea)}Skill/
    skill.md              # Claude skill definition for this tool
agent.md                  # AI agent configuration
CLAUDE.md                 # This file
\`\`\`

---

## Development Commands

\`\`\`bash
npm install        # Install dependencies
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build
npm run start      # Start production server
\`\`\`

---

## Environment Variables

Copy \`.env.example\` to \`.env.local\` and fill in your keys:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Required:
- \`OPENAI_API_KEY\` — from platform.openai.com
- \`NEXT_PUBLIC_SUPABASE_URL\` — from supabase.com
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` — from supabase.com
- \`SUPABASE_SERVICE_ROLE_KEY\` — from supabase.com

---

## Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor
3. Run the contents of \`supabase/schema.sql\`
4. Copy your project URL and keys into \`.env.local\`

---

## AI Integration

The core AI logic lives in \`src/app/api/process/route.ts\`.

- Model: \`gpt-4o\`
- System prompt: tuned for ${idea.category} expertise
- Max tokens: 1024
- The system prompt focuses on: ${idea.solution}

To change the AI behaviour, edit the \`SYSTEM_PROMPT\` constant in the API route.

---

## Deployment (Vercel)

\`\`\`bash
npm i -g vercel
vercel --prod
\`\`\`

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Revenue Model

${idea.revenueModel}

**Revenue Potential:** ${idea.revenuePotential}

**Time to MVP:** ${idea.timeToMVP} · **Difficulty:** ${idea.difficulty}

---

## Why Now

${idea.whyNow}

---

*Generated by [AIHub 1M Ideas](https://aihub-eight-xi.vercel.app/million-ideas)*
`;
}

// ─── agent.md ─────────────────────────────────────────────────────────────────

function agentMd(idea: Idea): string {
  return `# ${idea.title} — Agent Configuration

## Agent Identity

**Name:** ${idea.title} AI Assistant
**Role:** Expert AI agent specialised in ${idea.category}
**Version:** 1.0.0

---

## Agent Purpose

> ${idea.tagline}

This agent helps users with ${idea.category.toLowerCase()} tasks by leveraging AI to:
${idea.features.map((f) => `- ${f}`).join("\n")}

---

## System Prompt

\`\`\`
You are an expert AI assistant for ${idea.title}, specialised in ${idea.category}.

${idea.solution}

Your responsibilities:
${idea.features.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Guidelines:
- Be specific, actionable, and professional
- Always provide concrete recommendations with clear next steps
- Ask clarifying questions when the user's situation is unclear
- Cite relevant industry standards, regulations, or best practices when applicable
- Format responses with clear structure: headers, bullet points, and numbered steps
- Keep responses focused and avoid unnecessary padding
\`\`\`

---

## Capabilities

| Capability | Description |
|---|---|
${idea.features.map((f) => `| ${f.split(" ").slice(0, 3).join(" ")} | ${f} |`).join("\n")}

---

## API Endpoint

\`\`\`
POST /api/process
Content-Type: application/json

Body: { "input": "Describe your situation..." }
Response: { "result": "AI-generated response..." }
\`\`\`

---

## Model Configuration

\`\`\`json
{
  "model": "gpt-4o",
  "max_tokens": 1024,
  "temperature": 0.7,
  "provider": "OpenAI"
}
\`\`\`

---

## Usage Examples

**Example input:**
> "I need help with ${idea.category.toLowerCase()} — specifically around ${idea.features[0]?.toLowerCase() ?? "my main challenge"}"

**Example output:**
> The agent analyses the situation, identifies the key pain point, and provides step-by-step actionable recommendations tailored to ${idea.category}.

---

## Revenue Model

${idea.revenueModel}

---

## Integration Notes

- Connect this agent to your Supabase database to log all interactions
- Enable Supabase RLS policies to keep user data private
- Use the sessions table to track conversation history
- Set up rate limiting at the API route level for production

---

*${idea.title} · Built with AIHub 1M Ideas*
`;
}

// ─── .claude/SKILLS/[Name]Skill/skill.md ─────────────────────────────────────

function skillMd(idea: Idea): string {
  const name = skillName(idea);
  return `---
name: ${name}Skill
description: AI skill for ${idea.title} — ${idea.tagline}
version: 1.0.0
category: ${idea.category}
difficulty: ${idea.difficulty}
---

# ${name} Skill

## What This Skill Does

${idea.solution}

This skill enables Claude to act as a specialised ${idea.category} expert, providing users with:
${idea.features.map((f) => `- ${f}`).join("\n")}

---

## When to Use This Skill

Activate this skill when the user needs help with:
- Any ${idea.category.toLowerCase()} related task or question
- Analysis and recommendations for: ${idea.features.slice(0, 3).join(", ")}
- Building or improving AI-powered ${idea.category.toLowerCase()} tools
- Understanding the ${idea.category.toLowerCase()} market and revenue opportunities

---

## Skill Behaviour

When this skill is active, Claude should:

1. **Adopt the persona** of a world-class ${idea.category} expert with deep AI knowledge
2. **Focus exclusively** on ${idea.category.toLowerCase()} use cases and challenges
3. **Provide structured responses** with clear sections, bullet points, and actionable steps
4. **Reference specific tools** from the tech stack: ${idea.techStack.join(", ")}
5. **Quantify recommendations** with dollar amounts, time estimates, and ROI projections

---

## System Prompt Integration

\`\`\`
You are an expert ${idea.category} AI assistant powered by ${idea.title}.

Problem you solve: ${idea.problem}

Your solution approach: ${idea.solution}

Always:
- Be specific and data-driven
- Reference real ${idea.category.toLowerCase()} workflows and pain points
- Suggest concrete implementation steps using: ${idea.techStack.slice(0, 3).join(", ")}
- Quantify the value you provide (time saved, cost reduced, revenue generated)

Revenue model context: ${idea.revenueModel}
\`\`\`

---

## Example Interactions

### Example 1 — Analysis Request
**User:** "Help me analyse my ${idea.category.toLowerCase()} situation"
**Skill response:** Provides structured analysis with key findings, risk factors, and recommended next steps

### Example 2 — Implementation Help
**User:** "How do I implement ${idea.features[0]?.toLowerCase() ?? "this feature"}?"
**Skill response:** Step-by-step technical guide with code examples, timeline, and resource requirements

### Example 3 — Revenue Strategy
**User:** "How should I price this tool?"
**Skill response:** Pricing strategy aligned with: ${idea.revenueModel}

---

## Tech Stack Reference

${idea.techStack.map((t) => `- **${t}** — core technology for this skill`).join("\n")}

---

## Output Format Guidelines

Always structure responses as:

\`\`\`markdown
## Summary
[1-2 sentence overview]

## Key Findings / Recommendations
- Point 1
- Point 2
- Point 3

## Action Steps
1. Step one (timeline: X days)
2. Step two (timeline: X days)

## Resources
- [Relevant link or tool]
\`\`\`

---

## Skill Metadata

| Field | Value |
|---|---|
| Revenue Potential | ${idea.revenuePotential} |
| Time to MVP | ${idea.timeToMVP} |
| Build Difficulty | ${idea.difficulty} |
| Why Now | ${idea.whyNow} |

---

*Skill generated by [AIHub 1M Ideas](https://aihub-eight-xi.vercel.app/million-ideas)*
`;
}

// ─── Existing file generators (unchanged) ─────────────────────────────────────

function packageJson(idea: Idea): string {
  return JSON.stringify(
    {
      name: idea.id,
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: {
        next: "15.1.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        typescript: "^5",
        tailwindcss: "^4",
        "lucide-react": "^0.468.0",
        openai: "^4.77.0",
        "@supabase/supabase-js": "^2.47.0",
        "framer-motion": "^11.15.0",
        ...(idea.techStack.some((t) => t.toLowerCase().includes("stripe"))
          ? { stripe: "^17.5.0", "@stripe/stripe-js": "^5.5.0" } : {}),
        ...(idea.techStack.some((t) => t.toLowerCase().includes("recharts"))
          ? { recharts: "^2.13.0" } : {}),
      },
      devDependencies: {
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
      },
    },
    null,
    2,
  );
}

function envExample(idea: Idea): string {
  const lines = [
    "# ─── App ────────────────────────────────────",
    "NEXT_PUBLIC_APP_URL=http://localhost:3000",
    "",
    "# ─── OpenAI ─────────────────────────────────",
    "OPENAI_API_KEY=sk-...",
    "",
    "# ─── Supabase ───────────────────────────────",
    "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY=your-service-key",
  ];
  if (idea.techStack.some((t) => t.toLowerCase().includes("stripe"))) {
    lines.push("", "# ─── Stripe ─────────────────────────────────");
    lines.push("STRIPE_SECRET_KEY=sk_test_...");
    lines.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...");
    lines.push("STRIPE_WEBHOOK_SECRET=whsec_...");
  }
  if (idea.techStack.some((t) => t.toLowerCase().includes("twilio"))) {
    lines.push("", "# ─── Twilio ─────────────────────────────────");
    lines.push("TWILIO_ACCOUNT_SID=AC...");
    lines.push("TWILIO_AUTH_TOKEN=...");
    lines.push("TWILIO_PHONE_NUMBER=+1...");
  }
  return lines.join("\n");
}

function rootLayout(idea: Idea): string {
  return `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "${idea.title}",
  description: "${idea.tagline}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
`;
}

function globalsCss(): string {
  return `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #6366f1;
  --muted: #f4f4f5;
  --border: #e4e4e7;
  --radius: 0.625rem;
}

* { box-sizing: border-box; }
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`;
}

function mainPage(idea: Idea): string {
  const features = JSON.stringify(idea.features, null, 2);
  const steps = [
    `Describe your ${idea.category.toLowerCase()} situation or paste relevant details`,
    `Our AI analyzes the context using specialized ${idea.category} knowledge`,
    `Receive actionable recommendations, insights, and next steps`,
    `Iterate by asking follow-up questions or refining your inputs`,
  ];
  const pricingTiers = [
    { name: "Starter", price: "Free", limit: "10 analyses/month", cta: "Get Started" },
    { name: "Pro", price: "$29", limit: "Unlimited analyses", cta: "Start Free Trial", highlight: true },
    { name: "Team", price: "$99", limit: "5 seats + API access", cta: "Contact Sales" },
  ];

  return `"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles, ArrowRight, CheckCircle2, Send, Loader2,
  RotateCcw, Copy, Check, ChevronDown, ChevronUp,
  Menu, X, Zap, Shield, Clock, Star,
} from "lucide-react";

const TITLE = ${JSON.stringify(idea.title)};
const TAGLINE = ${JSON.stringify(idea.tagline)};
const CATEGORY = ${JSON.stringify(idea.category)};
const EMOJI = ${JSON.stringify(idea.emoji ?? "🤖")};
const REVENUE = ${JSON.stringify(idea.revenuePotential)};
const FEATURES: string[] = ${features};
const HOW_IT_WORKS = ${JSON.stringify(steps, null, 2)};
const FAQ = [
  { q: "How accurate is the AI analysis?", a: "Our AI is trained on thousands of ${idea.category.toLowerCase()} cases and continuously improved. Always verify critical decisions with a licensed professional." },
  { q: "Is my data secure?", a: "All inputs are encrypted in transit and at rest. We never store personally identifiable information without consent." },
  { q: "How fast are the results?", a: "Most analyses complete in under 10 seconds. Complex cases with extensive details may take up to 30 seconds." },
  { q: "Can I use this for commercial purposes?", a: "Yes — the Pro and Team plans include full commercial usage rights. The Starter plan is for personal use only." },
];
const PRICING = ${JSON.stringify(pricingTiers, null, 2)};

type Message = { role: "user" | "assistant"; content: string; ts: number };

export default function App() {
  // Nav
  const [menuOpen, setMenuOpen] = useState(false);
  // Tool
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  // Active section for nav
  const [activeSection, setActiveSection] = useState("tool");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    const userMsg: Message = { role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, history: messages }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.result, ts: Date.now() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setInput("");
    setError("");
  }

  async function copyMsg(content: string, idx: number) {
    await navigator.clipboard.writeText(content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  const NAV_LINKS = ["Tool", "Features", "How It Works", "Pricing", "FAQ"];

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#080c14]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{EMOJI}</span>
            <span className="font-black text-lg tracking-tight">{TITLE}</span>
          </div>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => setActiveSection(link.toLowerCase().replace(/ /g, "-"))}
                className="px-3 py-2 text-sm rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {link}
              </button>
            ))}
            <button
              onClick={() => setActiveSection("tool")}
              className="ml-3 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Try Free
            </button>
          </nav>
          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/8 bg-[#080c14] px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => { setActiveSection(link.toLowerCase().replace(/ /g, "-")); setMenuOpen(false); }}
                className="text-left px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm"
              >
                {link}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          {CATEGORY} · AI-Powered · {REVENUE} potential
        </div>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5 tracking-tight">{TITLE}</h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">{TAGLINE}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActiveSection("tool")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer text-base"
          >
            <Zap className="w-4 h-4" />
            Start Analyzing Free
          </button>
          <button
            onClick={() => setActiveSection("how-it-works")}
            className="flex items-center gap-2 text-slate-400 hover:text-white px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors cursor-pointer text-sm"
          >
            How it works
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> No signup required</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Results in seconds</span>
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> 10 free analyses</span>
        </div>
      </section>

      {/* ── AI Tool Interface ── */}
      <section id="tool" className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-[#0d1421] border border-white/8 rounded-2xl overflow-hidden">
          {/* Tool header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">{TITLE}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{CATEGORY} AI Assistant</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                New Session
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="min-h-[300px] max-h-[480px] overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="text-4xl mb-3">{EMOJI}</div>
                <p className="text-white font-semibold mb-1">Ready to analyze</p>
                <p className="text-slate-500 text-sm max-w-xs">{TAGLINE}</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {FEATURES.slice(0, 4).map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(\`Help me with: \${f}\`)}
                      className="text-left text-xs text-slate-400 hover:text-white bg-white/3 hover:bg-white/8 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all cursor-pointer"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={\`flex \${msg.role === "user" ? "justify-end" : "justify-start"}\`}>
                <div className={\`relative group max-w-[85%] rounded-2xl px-4 py-3 \${msg.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white/5 border border-white/8 text-slate-200 rounded-bl-sm"}\`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyMsg(msg.content, i)}
                      aria-label="Copy response"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {copied === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing…</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {error}
                <button onClick={() => setError("")} className="ml-3 underline cursor-pointer hover:text-red-300">Dismiss</button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="border-t border-white/8 p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="ai-input" className="sr-only">Your message</label>
                <textarea
                  id="ai-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } }}
                  placeholder="Describe your situation or ask a question… (Enter to send)"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex-shrink-0 flex items-center justify-center w-11 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-700 mt-2 text-center">AI can make mistakes. Verify important decisions independently.</p>
          </form>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0a0d14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Built specifically for {CATEGORY.toLowerCase()} professionals and their clients.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#0d1421] border border-white/6 rounded-xl p-5 hover:border-white/12 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black mb-3">How It Works</h2>
          <p className="text-slate-400">Get expert-level {CATEGORY.toLowerCase()} insights in four steps.</p>
        </div>
        <div className="space-y-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex items-start gap-5 bg-[#0d1421] border border-white/6 rounded-xl p-5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400 font-black text-sm">
                {i + 1}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-1">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0a0d14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Simple Pricing</h2>
            <p className="text-slate-400">Start free. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING.map((tier, i) => (
              <div key={i} className={\`relative rounded-2xl p-6 border \${tier.highlight ? "border-indigo-500/40 bg-indigo-500/5" : "border-white/8 bg-[#0d1421]"}\`}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <p className="font-bold text-white mb-1">{tier.name}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-black">{tier.price}</span>
                  {tier.price !== "Free" && <span className="text-slate-500 text-sm">/mo</span>}
                </div>
                <p className="text-slate-400 text-sm mb-5">{tier.limit}</p>
                <button className={\`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer \${tier.highlight ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-white/5 hover:bg-white/10 text-white border border-white/10"}\`}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black mb-3">FAQ</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-[#0d1421] border border-white/8 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors cursor-pointer"
                aria-expanded={openFaq === i}
              >
                <span className="font-semibold text-sm text-white pr-4">{item.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0a0d14]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">{EMOJI}</div>
          <h2 className="text-3xl font-black mb-3">Start in seconds — it's free</h2>
          <p className="text-slate-400 mb-8">{TAGLINE}</p>
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setActiveSection("tool"); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer mx-auto"
          >
            <Zap className="w-4 h-4" />
            Get Started Free
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>{EMOJI}</span>
            <span className="font-bold text-slate-500">{TITLE}</span>
          </div>
          <span>Generated by AIHub · aihub-eight-xi.vercel.app</span>
        </div>
      </footer>
    </div>
  );
}
`;
}

function apiRoute(idea: Idea): string {
  return `import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = \`You are an expert AI assistant for ${idea.title}, specialised in ${idea.category}.

WHAT YOU DO:
${idea.solution}

YOUR CAPABILITIES:
${idea.features.map((f: string, i: number) => `${i + 1}. ${f}`).join("\\n")}

RESPONSE STYLE:
- Be specific, actionable, and professional
- Structure responses with clear sections using markdown
- Use bullet points and numbered lists for steps
- Provide concrete recommendations with timelines and next steps
- Ask clarifying questions when the user's situation needs more detail
- Reference specific ${idea.category.toLowerCase()} best practices and standards
- Quantify recommendations where possible (time, cost, risk level)\`;

type OAMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: NextRequest) {
  try {
    const { input, history = [] } = await req.json() as { input: string; history: OAMessage[] };
    if (!input?.trim()) return NextResponse.json({ error: "Input required" }, { status: 400 });

    // Build message thread with conversation history for multi-turn chat
    const messages: OAMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m: OAMessage) => ({ role: m.role, content: m.content })),
      { role: "user", content: input },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({
      result,
      tokens: completion.usage?.total_tokens ?? 0,
    });
  } catch (err) {
    console.error("[api/process]", err);
    return NextResponse.json({ error: "Processing failed. Please try again." }, { status: 500 });
  }
}
`;
}

function supabaseClient(): string {
  return `import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
`;
}

function readme(idea: Idea): string {
  return `# ${idea.title}

> ${idea.tagline}

## Overview

**Problem:** ${idea.problem}

**Solution:** ${idea.solution}

## Revenue Model

${idea.revenueModel} — **Potential:** ${idea.revenuePotential}

## Quick Start

\`\`\`bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

${idea.techStack.map((t) => `- ${t}`).join("\n")}

## Features

${idea.features.map((f) => `- ✅ ${f}`).join("\n")}

## Build Info

**Difficulty:** ${idea.difficulty} · **Time to MVP:** ${idea.timeToMVP}

## Why Now

${idea.whyNow}

## Deploy

\`\`\`bash
npx vercel --prod
\`\`\`

See \`CLAUDE.md\` for full development guide and \`.claude/SKILLS/\` for AI skill configuration.

---
*Generated by [AIHub 1M Ideas](https://aihub-eight-xi.vercel.app/million-ideas)*
`;
}

function supabaseSchema(idea: Idea): string {
  return `-- ${idea.title} — Supabase Schema
create extension if not exists "uuid-ossp";

create table if not exists sessions (
  id         uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  user_email text,
  metadata   jsonb default '{}'
);

create table if not exists requests (
  id             uuid primary key default uuid_generate_v4(),
  session_id     uuid references sessions(id),
  created_at     timestamptz default now(),
  input          text not null,
  output         text,
  processing_ms  integer,
  model          text default 'gpt-4o'
);

alter table sessions enable row level security;
alter table requests enable row level security;

create policy "Public sessions" on sessions for all using (true);
create policy "Public requests" on requests for all using (true);

create index if not exists idx_requests_session on requests(session_id);
create index if not exists idx_requests_created on requests(created_at desc);
`;
}

// ─── Main ZIP builder ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { idea } = (await req.json()) as { idea: Idea };
    if (!idea?.id || !idea?.title) {
      return NextResponse.json({ error: "Missing idea data" }, { status: 400 });
    }

    const zip  = new JSZip();
    const root = zip.folder(idea.id)!;
    const name = skillName(idea);

    // ── Root files ──────────────────────────────────────────
    root.file("CLAUDE.md",      claudeMd(idea));
    root.file("agent.md",       agentMd(idea));
    root.file("README.md",      readme(idea));
    root.file("package.json",   packageJson(idea));
    root.file(".env.example",   envExample(idea));
    root.file("next.config.ts", `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n`);
    root.file("tsconfig.json",  JSON.stringify({
      compilerOptions: {
        target: "ES2017", lib: ["dom","dom.iterable","esnext"], allowJs: true,
        skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true,
        module: "esnext", moduleResolution: "bundler", resolveJsonModule: true,
        isolatedModules: true, jsx: "preserve", incremental: true,
        plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }, null, 2));

    // ── .claude/SKILLS/ — idea skill + bundled design/dev skills ───
    const claudeDir = root.folder(".claude")!;
    const skillsDir = claudeDir.folder("SKILLS")!;
    const skillDir  = skillsDir.folder(`${name}Skill`)!;
    skillDir.file("skill.md", skillMd(idea));

    // Bundle the UI/UX and React skills from AIHub's skill library
    skillsDir.folder("ui-ux-pro-max")!.file("SKILL.md", UI_UX_SKILL);
    skillsDir.folder("react-best-practices")!.file("SKILL.md", REACT_SKILL);
    skillsDir.folder("senior-frontend")!.file("SKILL.md", SENIOR_FRONTEND_SKILL);

    // ── src/ ────────────────────────────────────────────────
    const src = root.folder("src")!;
    const app = src.folder("app")!;
    app.file("layout.tsx",    rootLayout(idea));
    app.file("globals.css",   globalsCss());
    app.file("page.tsx",      mainPage(idea));

    const processRoute = app.folder("api")!.folder("process")!;
    processRoute.file("route.ts", apiRoute(idea));

    const lib = src.folder("lib")!;
    lib.file("supabase.ts", supabaseClient());
    lib.file("utils.ts", `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`);

    // ── supabase/ ───────────────────────────────────────────
    root.folder("supabase")!.file("schema.sql", supabaseSchema(idea));

    const buffer   = await zip.generateAsync({ type: "arraybuffer" });
    const filename = `${idea.id}-starter-kit.zip`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":        "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("[download-idea]", err);
    return NextResponse.json({ error: "Download failed: " + String(err) }, { status: 500 });
  }
}
