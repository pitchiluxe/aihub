import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import type { Idea } from "@/app/(app)/million-ideas/ideas-data";

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
          ? { stripe: "^17.5.0", "@stripe/stripe-js": "^5.5.0" }
          : {}),
        ...(idea.techStack.some((t) => t.toLowerCase().includes("recharts"))
          ? { recharts: "^2.13.0" }
          : {}),
      },
      devDependencies: {
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
      },
    },
    null,
    2
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
  if (idea.techStack.some((t) => t.toLowerCase().includes("plaid"))) {
    lines.push("", "# ─── Plaid ──────────────────────────────────");
    lines.push("PLAID_CLIENT_ID=...");
    lines.push("PLAID_SECRET=...");
    lines.push("PLAID_ENV=sandbox");
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
  return `"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

const FEATURES = ${JSON.stringify(idea.features, null, 2)};

export default function HomePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm px-4 py-2 rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          ${idea.category} · AI-Powered
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          ${idea.title}
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          ${idea.tagline}
        </p>

        {/* Main Input */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your situation or question..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {loading ? "Analyzing..." : "Analyze"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-8 max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12 text-slate-200">What It Does</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/5 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
`;
}

function apiRoute(idea: Idea): string {
  return `import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = \`You are an AI assistant for ${idea.title}.
${idea.solution}

Your job: analyze the user's input and provide a clear, actionable, specific response.
Be direct, precise, and professional. Output plain text.\`;

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input?.trim()) {
      return NextResponse.json({ error: "Input required" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
      max_tokens: 1024,
    });

    const result = completion.choices[0]?.message?.content ?? "No response generated.";
    return NextResponse.json({ result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
`;
}

function supabaseClient(): string {
  return `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

${idea.revenueModel}

**Revenue Potential:** ${idea.revenuePotential}

## Getting Started

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Set up Supabase
# Create a project at https://supabase.com
# Run the SQL schema (see supabase/schema.sql)

# 4. Run the development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

${idea.techStack.map((t) => `- ${t}`).join("\n")}

## Features

${idea.features.map((f) => `- ✅ ${f}`).join("\n")}

## Difficulty

**Build Difficulty:** ${idea.difficulty}
**Time to MVP:** ${idea.timeToMVP}

## Why Now

${idea.whyNow}

## Deployment

This app is designed to deploy on **Vercel** with zero configuration:

\`\`\`bash
npm i -g vercel
vercel --prod
\`\`\`

Set your environment variables in the Vercel dashboard.

---

Generated by **AIHub 1M Ideas** — [aihub.dev](https://aihub.dev)
`;
}

function supabaseSchema(idea: Idea): string {
  return `-- ${idea.title} — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable extensions
create extension if not exists "uuid-ossp";

-- Users/sessions table
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  user_email text,
  metadata jsonb default '{}'
);

-- Requests log
create table if not exists requests (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id),
  created_at timestamptz default now(),
  input text not null,
  output text,
  processing_ms integer,
  model text default 'gpt-4o'
);

-- Enable RLS
alter table sessions enable row level security;
alter table requests enable row level security;

-- Public read policy (adjust as needed)
create policy "Public sessions" on sessions for all using (true);
create policy "Public requests" on requests for all using (true);

-- Indexes
create index if not exists idx_requests_session on requests(session_id);
create index if not exists idx_requests_created on requests(created_at desc);
`;
}

export async function POST(req: NextRequest) {
  try {
    const { idea } = (await req.json()) as { idea: Idea };

    if (!idea?.id || !idea?.title) {
      return NextResponse.json({ error: "Missing idea data" }, { status: 400 });
    }

    const zip = new JSZip();
    const root = zip.folder(idea.id)!;

    // Root files
    root.file("package.json", packageJson(idea));
    root.file(".env.example", envExample(idea));
    root.file("README.md", readme(idea));
    root.file("tsconfig.json", JSON.stringify({
      compilerOptions: {
        target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true,
        skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true,
        module: "esnext", moduleResolution: "bundler", resolveJsonModule: true,
        isolatedModules: true, jsx: "preserve", incremental: true,
        plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }, null, 2));
    root.file("next.config.ts", `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n`);

    // Source files
    const src = root.folder("src")!;
    const app = src.folder("app")!;
    app.file("layout.tsx", rootLayout(idea));
    app.file("globals.css", globalsCss());
    app.file("page.tsx", mainPage(idea));

    // API route
    const api = app.folder("api")!;
    const processRoute = api.folder("process")!;
    processRoute.file("route.ts", apiRoute(idea));

    // Lib
    const lib = src.folder("lib")!;
    lib.file("supabase.ts", supabaseClient());
    lib.file("utils.ts", `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`);

    // Supabase schema
    const supabase = root.folder("supabase")!;
    supabase.file("schema.sql", supabaseSchema(idea));

    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    const filename = `${idea.id}-starter-kit.zip`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("download-idea error:", err);
    return NextResponse.json({ error: "Download failed: " + String(err) }, { status: 500 });
  }
}
