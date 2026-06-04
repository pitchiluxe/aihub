"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import {
  Lightbulb, Flame, Search, Download, ExternalLink, X,
  Copy, Check, ChevronRight, Sparkles, Zap, Clock, TrendingUp,
  Globe, Code2, FileText, Terminal, Star, ArrowRight, Filter,
  Rocket, DollarSign, Users, Building, Heart, Hammer,
  ShoppingCart, Truck, BookOpen, Briefcase, Leaf,
  Send, MessageSquare, ThumbsUp, Palette, Package, RefreshCw,
} from "lucide-react";
import { IDEAS, CATEGORIES, CATEGORY_META, type Idea } from "./ideas-data";
import type { GeneratedIdea } from "@/app/api/daily-ideas/route";

// Merge AI-generated idea into the Idea shape (colour falls back to indigo)
function toIdea(g: GeneratedIdea): Idea {
  const meta = CATEGORY_META[g.category];
  return {
    ...g,
    color: meta?.color ?? "#6366f1",
    gradient: meta?.gradient ?? "from-indigo-500/20 to-indigo-900/10",
    isHot: true,
  };
}

// ─── Daily-seeded shuffle ──────────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailyIdeas(): Idea[] {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD — changes at UTC midnight
  const rng = mulberry32(hashStr(today));
  const arr = [...IDEAS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function msUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

// ─── Category Icon Map ─────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Healthcare: Heart, Legal: Briefcase, Education: BookOpen, Finance: DollarSign,
  "Home Services": Hammer, Construction: Building, Food: Sparkles, Agriculture: Leaf,
  HR: Users, "Mental Health": Heart, "Real Estate": Building, Retail: ShoppingCart,
  "Web Design": Globe, Government: Building, Logistics: Truck,
  Automation: Zap, Marketing: TrendingUp, Automotive: Truck, "Beauty & Wellness": Sparkles,
  Insurance: Building, "E-commerce": ShoppingCart, "Property Mgmt": Building,
  Accounting: DollarSign, "Non-profit": Heart, "Pet Care": Heart,
};

// ─── Difficulty colours ────────────────────────────────────────────────────
const DIFFICULTY_COLOR = { Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20", Hard: "text-red-400 bg-red-500/10 border-red-500/20" };

// ─── Code Modal files ──────────────────────────────────────────────────────
function getModalFiles(idea: Idea) {
  return [
    {
      name: "README.md",
      lang: "markdown",
      content: `# ${idea.title}

> ${idea.tagline}

## The Problem
${idea.problem}

## The Solution
${idea.solution}

## Revenue Model
${idea.revenueModel}
**Potential:** ${idea.revenuePotential}

## Build Difficulty
${idea.difficulty} · ${idea.timeToMVP} to MVP

## Tech Stack
${idea.techStack.map((t) => `- ${t}`).join("\n")}

## Core Features
${idea.features.map((f) => `- ✅ ${f}`).join("\n")}

## Why Now
${idea.whyNow}
`,
    },
    {
      name: "src/app/page.tsx",
      lang: "tsx",
      content: `"use client";

import { useState } from "react";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 to-indigo-950 text-white p-8">
      <h1 className="text-4xl font-black mb-2">${idea.title}</h1>
      <p className="text-slate-400 mb-8">${idea.tagline}</p>
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your situation..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-semibold"
        >
          {loading ? "..." : "Analyze"}
        </button>
      </form>
      {result && (
        <div className="mt-6 max-w-2xl bg-white/5 rounded-xl p-6">
          <p className="whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </main>
  );
}
`,
    },
    {
      name: "src/app/api/process/route.ts",
      lang: "typescript",
      content: `import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = \`You are an expert AI for ${idea.title}.
${idea.solution}

Analyze the user's input and provide clear, actionable, specific guidance.
Be direct and professional.\`;

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  if (!input?.trim())
    return NextResponse.json({ error: "Input required" }, { status: 400 });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input },
    ],
    max_tokens: 1024,
  });

  return NextResponse.json({
    result: completion.choices[0]?.message?.content ?? "",
  });
}
`,
    },
    {
      name: "supabase/schema.sql",
      lang: "sql",
      content: `-- ${idea.title} schema
create extension if not exists "uuid-ossp";

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  user_email text,
  metadata jsonb default '{}'
);

create table if not exists requests (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id),
  created_at timestamptz default now(),
  input text not null,
  output text,
  processing_ms integer,
  model text default 'gpt-4o'
);

alter table sessions enable row level security;
alter table requests enable row level security;

create index if not exists idx_requests_created on requests(created_at desc);
`,
    },
    {
      name: ".env.example",
      lang: "bash",
      content: `NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key${idea.techStack.some(t => t.toLowerCase().includes("stripe")) ? "\nSTRIPE_SECRET_KEY=sk_test_...\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." : ""}${idea.techStack.some(t => t.toLowerCase().includes("twilio")) ? "\nTWILIO_ACCOUNT_SID=AC...\nTWILIO_AUTH_TOKEN=..." : ""}
`,
    },
  ];
}

// ─── Code Modal ────────────────────────────────────────────────────────────
function CodeModal({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  const files = getModalFiles(idea);
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadKit() {
    setDownloading(true);
    try {
      const res = await fetch("/api/download-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${idea.id}-starter-kit.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{idea.emoji}</span>
            <div>
              <p className="font-bold text-white leading-none">{idea.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">Production-ready starter kit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadKit}
              disabled={downloading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? "Generating…" : "Download ZIP"}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* File tree */}
          <div className="w-52 flex-shrink-0 border-r border-white/10 bg-[#0a0d13] overflow-y-auto">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Project files</p>
            {files.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveFile(i)}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 text-xs transition-colors ${i === activeFile ? "bg-indigo-500/20 text-indigo-300 border-r-2 border-indigo-500" : "text-slate-500 hover:text-slate-300 hover:bg-white/3"}`}
              >
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>

          {/* Code pane */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0d1117] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-400 font-mono">{files[activeFile].name}</span>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-5 text-xs leading-relaxed font-mono text-slate-300 bg-[#0d1117] whitespace-pre-wrap">
              {files[activeFile].content}
            </pre>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Idea Card ─────────────────────────────────────────────────────────────
function IdeaCard({ idea, index, onGetCode, onReview, rating }: {
  idea: Idea; index: number;
  onGetCode: (idea: Idea) => void;
  onReview: (idea: Idea) => void;
  rating?: IdeaRating;
}) {
  const CatIcon = CATEGORY_ICONS[idea.category] ?? Lightbulb;
  const meta = CATEGORY_META[idea.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative flex flex-col bg-[#0d1421] border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ boxShadow: `0 0 0 0 ${meta?.color ?? "#6366f1"}00` }}
      whileHover={{ boxShadow: `0 8px 40px ${meta?.color ?? "#6366f1"}22` }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${meta?.color ?? "#6366f1"}, transparent)` }} />

      {/* Hot / featured badges */}
      {idea.isHot && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
          <Flame className="w-2.5 h-2.5" /> HOT
        </div>
      )}
      {!idea.isHot && idea.isFeatured && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
          <Star className="w-2.5 h-2.5" /> FEATURED
        </div>
      )}

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-white/5" style={{ background: `${meta?.color ?? "#6366f1"}18` }}>
            {idea.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <CatIcon className="w-3 h-3 flex-shrink-0" style={{ color: meta?.color ?? "#6366f1" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta?.color ?? "#6366f1" }}>{idea.category}</span>
            </div>
            <h3 className="text-sm font-bold text-white leading-tight">{idea.title}</h3>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs text-slate-400 italic leading-relaxed">"{idea.tagline}"</p>

        {/* Revenue */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold">
            <TrendingUp className="w-3 h-3" />
            {idea.revenuePotential}
          </div>
          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${DIFFICULTY_COLOR[idea.difficulty]}`}>
            {idea.difficulty}
          </div>
        </div>

        {/* Problem */}
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">The Problem</p>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{idea.problem}</p>
        </div>

        {/* Solution */}
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">The Solution</p>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{idea.solution}</p>
        </div>

        {/* Stack chips */}
        <div className="flex flex-wrap gap-1.5">
          {idea.techStack.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] bg-white/5 border border-white/8 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {t}
            </span>
          ))}
          {idea.techStack.length > 4 && (
            <span className="text-[10px] text-slate-600 px-1">+{idea.techStack.length - 4} more</span>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>MVP in <span className="text-slate-300 font-medium">{idea.timeToMVP}</span></span>
        </div>
      </div>

      {/* Rating row */}
      <div className="px-5 pb-3 flex items-center justify-between flex-shrink-0">
        {rating && rating.count > 0 ? (
          <div className="flex items-center gap-2">
            <StarDisplay rating={rating.avg} />
            <span className="text-xs text-amber-400 font-semibold">{rating.avg}</span>
            <span className="text-xs text-slate-600">({rating.count} review{rating.count !== 1 ? "s" : ""})</span>
          </div>
        ) : (
          <span className="text-xs text-slate-600">No reviews yet</span>
        )}
        <button
          onClick={() => onReview(idea)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Rate
        </button>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2 flex-shrink-0">
        <button
          onClick={() => onGetCode(idea)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20"
        >
          <Code2 className="w-3.5 h-3.5" />
          Get Starter Kit
        </button>
        <a
          href={`/agents?prompt=Help me build: ${encodeURIComponent(idea.title + " — " + idea.tagline)}`}
          className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
        >
          <Rocket className="w-3.5 h-3.5" />
          Build It
        </a>
      </div>
    </motion.div>
  );
}

// ─── Star Rating display ───────────────────────────────────────────────────
function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const px = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${px} ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
      ))}
    </div>
  );
}

// ─── Review Modal ──────────────────────────────────────────────────────────
function ReviewModal({ idea, onClose, onSubmitted }: { idea: Idea; onClose: () => void; onSubmitted: (ideaId: string, avg: number, count: number) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, rating, comment }),
      });
      const data = await res.json();
      onSubmitted(idea.id, data.avgRating, data.count);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
        className="w-full max-w-md bg-[#0d1421] border border-white/10 rounded-2xl p-6"
      >
        {done ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-white font-bold text-lg mb-1">Thanks for your feedback!</p>
            <p className="text-slate-400 text-sm">Your review helps others discover great ideas.</p>
            <button onClick={onClose} className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-slate-500 mb-1">Rate this idea</p>
                <p className="font-bold text-white text-base leading-tight">{idea.title}</p>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 transition-all ${s <= (hover || rating) ? "text-amber-400 fill-amber-400 scale-110" : "text-slate-700"}`} />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-amber-400 font-medium ml-1">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                </span>
              )}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 280))}
              placeholder="Share your thoughts (optional)..."
              rows={3}
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 resize-none mb-1"
            />
            <p className="text-right text-xs text-slate-600 mb-4">{comment.length}/280</p>
            <button
              onClick={submit}
              disabled={!rating || submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {submitting ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Review
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Website Generator Modal ───────────────────────────────────────────────
type GenStep = "idle" | "generating" | "done" | "error";
const GEN_STEPS = ["Choosing design style", "Writing HTML & components", "Styling with Tailwind", "Packaging files"];

function WebsiteGeneratorModal({
  businessType, businessName, tagline, city, onClose,
}: {
  businessType: string; businessName: string; tagline: string; city: string; onClose: () => void;
}) {
  const [step, setStep] = useState<GenStep>("generating");
  const [stepIdx, setStepIdx] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [designStyle, setDesignStyle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const slugRef = useRef(`${(businessName || "website").toLowerCase().replace(/[^a-z0-9]/g, "-")}-website.zip`);

  useEffect(() => {
    // Animate steps while generating
    const interval = setInterval(() => setStepIdx((p) => Math.min(p + 1, GEN_STEPS.length - 1)), 4500);

    fetch("/api/generate-website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessType, businessName, tagline, city }),
    })
      .then(async (res) => {
        clearInterval(interval);
        if (!res.ok) throw new Error(await res.text());
        const style = res.headers.get("X-Design-Style") ?? "";
        setDesignStyle(style);
        const b = await res.blob();
        setBlob(b);
        setStepIdx(GEN_STEPS.length - 1);
        setStep("done");
        // Track download
        fetch("/api/track-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "website", itemId: businessType, itemTitle: businessName || businessType }),
        }).catch(() => {});
      })
      .catch((e) => { clearInterval(interval); setErrorMsg(String(e)); setStep("error"); });

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function download() {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = slugRef.current; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && step !== "generating" && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0d1421] border border-white/10 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{businessName || businessType} Website</p>
              <p className="text-xs text-slate-500 mt-0.5">{businessType} · {city || "Your City"}</p>
            </div>
          </div>
          {step !== "generating" && (
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          )}
        </div>

        <div className="p-6">
          {step === "generating" && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
                <p className="text-white font-semibold">Building your {businessType} website…</p>
              </div>
              <div className="space-y-3">
                {GEN_STEPS.map((s, i) => (
                  <div key={s} className={`flex items-center gap-3 text-sm transition-all ${i <= stepIdx ? "text-white" : "text-slate-600"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${i < stepIdx ? "bg-emerald-500" : i === stepIdx ? "border-2 border-indigo-400 border-t-transparent animate-spin" : "border border-white/10"}`}>
                      {i < stepIdx && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {s}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-6 text-center">This takes 20–40 seconds. AI is writing real code for you.</p>
            </div>
          )}

          {step === "done" && (
            <div className="py-2">
              <div className="flex items-center gap-3 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-emerald-300 font-semibold text-sm">Website ready to download!</p>
                  {designStyle && <p className="text-emerald-400/70 text-xs mt-0.5">Design style: {designStyle}</p>}
                </div>
              </div>
              <div className="space-y-2 mb-6 text-sm">
                {[
                  "Complete Next.js 15 + Tailwind CSS codebase",
                  "Fully responsive, mobile-first design",
                  "Unique AI-designed layout — not a template",
                  "Deploy instantly with `vercel --prod`",
                  "100% yours — no attribution required",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={download}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <Package className="w-4 h-4" />
                  Download ZIP
                </button>
                <button onClick={onClose} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 rounded-xl text-sm transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="py-4 text-center">
              <p className="text-red-400 font-semibold mb-2">Generation failed</p>
              <p className="text-slate-400 text-sm mb-4">{errorMsg || "Please try again."}</p>
              <button onClick={onClose} className="bg-white/8 hover:bg-white/12 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors">Close</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Website Builder Section ───────────────────────────────────────────────
const SITE_TYPES = [
  { icon: Hammer,   label: "Trade Business",      desc: "Plumber · Electrician · HVAC · Roofer",   color: "#f97316" },
  { icon: Heart,    label: "Medical Practice",     desc: "Doctor · Dentist · Therapist · Clinic",   color: "#ef4444" },
  { icon: Briefcase,label: "Law Firm",             desc: "Solo · Boutique · Personal Injury",        color: "#6366f1" },
  { icon: Sparkles, label: "Restaurant / Cafe",    desc: "Any dining concept or food business",      color: "#f59e0b" },
  { icon: Code2,    label: "Freelancer Portfolio", desc: "Developer · Designer · Consultant",        color: "#10b981" },
];

function WebsiteBuilderSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const [formData, setFormData] = useState({ businessName: "", tagline: "", city: "" });
  const [genOpen, setGenOpen] = useState(false);

  const selectedType = selected !== null ? SITE_TYPES[selected] : null;

  return (
    <section className="mt-16 mb-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Globe className="w-3.5 h-3.5" />
            AI Website Builder
          </div>
          <h2 className="text-3xl font-black text-white mb-3">
            AI Builds Your Full Website <span className="text-purple-400">— Download the Code</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Pick your industry, fill 3 fields, and AI generates a complete, production-ready Next.js codebase with a unique design — download and deploy in minutes.
          </p>
        </div>

        {/* Site type picker */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {SITE_TYPES.map((type, i) => {
            const Icon = type.icon;
            return (
              <button
                key={i}
                onClick={() => setSelected(selected === i ? null : i)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${selected === i ? "border-purple-500/40 bg-purple-500/10 shadow-lg shadow-purple-500/10" : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/4"}`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${type.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: type.color }} />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{type.label}</span>
                <span className="text-[10px] text-slate-500 leading-tight">{type.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <AnimatePresence>
          {selectedType && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="bg-[#0d1421] border border-white/8 rounded-2xl p-6"
            >
              <div className="grid md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Business Name</label>
                  <input
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Johnson Plumbing"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Tagline</label>
                  <input
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Your value proposition"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">City / Area</label>
                  <input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Austin, TX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGenOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20 text-sm"
                >
                  <Palette className="w-4 h-4" />
                  Generate My Website
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-slate-500 leading-relaxed">
                  AI picks a unique design style and writes the full codebase. Every generation is different.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generator modal */}
      <AnimatePresence>
        {genOpen && selectedType && (
          <WebsiteGeneratorModal
            businessType={selectedType.label}
            businessName={formData.businessName}
            tagline={formData.tagline}
            city={formData.city}
            onClose={() => setGenOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Review state type ─────────────────────────────────────────────────────
interface IdeaRating { avg: number; count: number }

// ─── Stripe Payment Gate ────────────────────────────────────────────────────
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/3cIeVd8vG2AJ6eM3EQdMI04";
const LS_ACCESS_KEY = "aihub_million_ideas_access";

// Attempt to read the device's local IP via WebRTC (detects iPhone hotspot 172.20.10.x)
function getLocalIPViaWebRTC(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .catch(() => resolve(null));
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const m = /(\d{1,3}(\.\d{1,3}){3})/.exec(e.candidate.candidate);
        if (m) { resolve(m[1]); pc.close(); }
      };
      setTimeout(() => resolve(null), 1500);
    } catch { resolve(null); }
  });
}

function PaymentGateModal({ onGoBack }: { onGoBack: () => void }) {
  const benefits = [
    "100+ AI business ideas refreshed daily",
    "Production-ready starter kits (ZIP download)",
    "AI-generated fresh ideas every 24 hours",
    "Code templates across 20+ industries",
    "Revenue & difficulty analysis per idea",
    "AI Website Builder included",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(7, 11, 18, 0.82)" }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full max-w-lg bg-[#0d1421] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Top gradient accent */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        <div className="p-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <Lightbulb className="w-3.5 h-3.5" />
            Premium Access Required
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-black text-white mb-2 leading-tight">
            Unlock{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              1M Ideas
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Get full access to 100+ world-changing AI business ideas, production-ready starter kits, and fresh AI-generated ideas every single day.
          </p>

          {/* Price card */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-black text-white">$19.99</span>
              <span className="text-slate-400 text-sm font-medium">/month</span>
            </div>
            <p className="text-xs text-slate-500">Cancel anytime · Instant access after payment</p>
          </div>

          {/* Feature list */}
          <div className="space-y-2.5 mb-7">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="text-sm text-slate-300">{b}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href={STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:shadow-xl hover:shadow-indigo-500/25 text-base"
          >
            <Zap className="w-5 h-5" />
            Get Access — $19.99/month
            <ArrowRight className="w-5 h-5" />
          </a>

          <p className="text-center text-xs text-slate-600 mt-4">
            Powered by Stripe · 256-bit SSL encryption · Cancel anytime
          </p>

          {/* Already paid fallback */}
          <button
            onClick={() => { window.location.href = "/million-ideas/success"; }}
            className="w-full text-center text-xs text-slate-500 hover:text-indigo-400 transition-colors mt-2 py-1.5"
          >
            Already paid? Click here to activate access
          </button>

          {/* Go back */}
          <button
            onClick={onGoBack}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mt-1 py-2"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Go back to AIHub
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const LS_KEY = (date: string) => `aihub_daily_ideas_${date}`;
const LS_REVIEWS = "aihub_reviews";

export default function MillionIdeasPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dailyIdeas, setDailyIdeas] = useState<Idea[]>([]);
  const [aiIdeas, setAiIdeas] = useState<Idea[]>([]);
  const [ratings, setRatings] = useState<Record<string, IdeaRating>>({});
  const [reviewTarget, setReviewTarget] = useState<Idea | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [locked, setLocked] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check payment access: trusted network → localStorage (with expiry) → subscription status
  useEffect(() => {
    async function checkAccess() {
      try {
        // 1. Owner's trusted network (WiFi / wired / iPhone hotspot) — always bypass
        try {
          const netRes = await fetch("/api/check-network", { cache: "no-store" });
          if (netRes.ok) {
            const { trusted } = (await netRes.json()) as { trusted: boolean };
            if (trusted) { setLocked(false); return; }
          }
        } catch { /* network error — continue */ }

        // 2. iPhone hotspot auto-detection (172.20.10.x)
        const localIP = await getLocalIPViaWebRTC();
        if (localIP?.startsWith("172.20.10.")) { setLocked(false); return; }

        // 3. Check localStorage for valid, non-expired access record
        const raw = localStorage.getItem(LS_ACCESS_KEY);
        if (raw) {
          try {
            // New format: JSON with expiresAt
            const record = JSON.parse(raw) as { granted: boolean; expiresAt: number; subscriptionId?: string | null };
            if (record.granted && record.expiresAt > Date.now()) {
              // 4. If we have a subscriptionId, verify it hasn't been cancelled server-side
              if (record.subscriptionId) {
                try {
                  const subRes = await fetch(`/api/check-subscription?id=${record.subscriptionId}`, { cache: "no-store" });
                  if (subRes.ok) {
                    const { active } = (await subRes.json()) as { active: boolean };
                    if (!active) {
                      // Subscription cancelled — revoke local access immediately
                      localStorage.removeItem(LS_ACCESS_KEY);
                      return; // stays locked
                    }
                  }
                } catch { /* DB error — give benefit of the doubt */ }
              }
              setLocked(false);
              return;
            }
            // Expired — clear it
            localStorage.removeItem(LS_ACCESS_KEY);
          } catch {
            // Legacy "true" string — clear and re-lock (no expiry data)
            localStorage.removeItem(LS_ACCESS_KEY);
          }
        }
      } catch { /* ignore — stay locked */ }
      finally { setCheckingAccess(false); }
    }
    checkAccess();
  }, []);

  // 1. Seeded shuffle of base ideas (changes each day)
  useEffect(() => {
    setDailyIdeas(getDailyIdeas());
    setCountdown(formatCountdown(msUntilMidnightUTC()));
    const refreshTimer = setTimeout(() => setDailyIdeas(getDailyIdeas()), msUntilMidnightUTC());
    const ticker = setInterval(() => setCountdown(formatCountdown(msUntilMidnightUTC())), 60_000);
    return () => { clearTimeout(refreshTimer); clearInterval(ticker); };
  }, []);

  // 2. Fetch AI ideas sequentially (one batch at a time) to avoid rate limits
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = LS_KEY(today);

    // Serve from localStorage on initial load only (skip cache on retry)
    if (retryKey === 0) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const parsed: GeneratedIdea[] = JSON.parse(stored);
          if (parsed.length >= 40) {
            setAiIdeas(parsed.map(toIdea));
            setAiLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    setAiLoading(true);
    setAiError(null);
    setAiIdeas([]);
    const allIdeas: GeneratedIdea[] = [];
    let cancelled = false;

    async function fetchBatch(batch: number) {
      try {
        const r = await fetch(`/api/daily-ideas?date=${today}&batch=${batch}`);
        if (cancelled) return;
        const data: { ideas: GeneratedIdea[]; error?: string } = await r.json();
        if (data.error) {
          console.error(`[daily-ideas] batch ${batch} API error:`, data.error);
          if (!cancelled) setAiError(data.error);
        }
        if (!cancelled && Array.isArray(data.ideas) && data.ideas.length > 0) {
          allIdeas.push(...data.ideas);
          setAiIdeas([...allIdeas].map(toIdea));
        }
      } catch (err) {
        if (!cancelled) {
          console.error(`[daily-ideas] batch ${batch} failed:`, err);
          setAiError(String(err));
        }
      }
    }

    // Sequential — one batch at a time to respect free-tier rate limits
    (async () => {
      for (const batch of [0, 1, 2, 3, 4]) {
        if (cancelled) break;
        await fetchBatch(batch);
      }
      if (!cancelled) {
        setAiLoading(false);
        if (allIdeas.length > 0) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(allIdeas));
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k?.startsWith("aihub_daily_ideas_") && k !== cacheKey) localStorage.removeItem(k);
            }
          } catch { /* ignore quota errors */ }
        }
      }
    })();

    return () => { cancelled = true; };
  }, [retryKey]);

  // 3. Load ratings from localStorage + server
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_REVIEWS);
      if (stored) setRatings(JSON.parse(stored));
    } catch { /* ignore */ }
    fetch("/api/reviews?all=1")
      .then((r) => r.json())
      .then((data: Record<string, { avgRating: number; count: number }>) => {
        const mapped: Record<string, IdeaRating> = {};
        for (const [id, v] of Object.entries(data)) mapped[id] = { avg: v.avgRating, count: v.count };
        setRatings((prev) => ({ ...prev, ...mapped }));
      })
      .catch(() => {});
  }, []);

  function handleReviewSubmitted(ideaId: string, avg: number, count: number) {
    setRatings((prev) => {
      const next = { ...prev, [ideaId]: { avg, count } };
      try { localStorage.setItem(LS_REVIEWS, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setReviewTarget(null);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return dailyIdeas.filter((idea) => {
      const matchCat = activeCategory === "All" || idea.category === activeCategory;
      const matchQ = !q || idea.title.toLowerCase().includes(q) || idea.problem.toLowerCase().includes(q) || idea.category.toLowerCase().includes(q) || idea.tagline.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [dailyIdeas, activeCategory, searchQuery]);

  const hotCount = dailyIdeas.filter((i) => i.isHot).length;
  const featuredCount = dailyIdeas.filter((i) => i.isFeatured).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#070b12]">
      <TopBar title="1M Ideas" description="World-changing AI tools waiting to be built" />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={locked ? { filter: "blur(10px)", pointerEvents: "none", userSelect: "none" } : undefined}
      >
        <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">

          {/* ── Hero ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden mb-10 border border-white/5"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1035 40%, #0f2027 100%)" }}
          >
            {/* Glow blobs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-4 right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative px-8 py-12 md:px-16">
              <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold px-4 py-2 rounded-full mb-6">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                Ideas Worth Building
              </div>

              <div className="flex items-end gap-4 mb-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-white to-indigo-300 bg-clip-text text-transparent">
                  1M Ideas
                </h1>
                <div className="mb-3 text-3xl">💡</div>
              </div>

              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">
                World-changing AI tools waiting to be built. Real problems. Real revenue. Production-ready code you can download and deploy today. <span className="text-white font-medium">Your $1M opportunity starts here.</span>
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Lightbulb, label: `${IDEAS.length} Ideas`, color: "#6366f1" },
                  { icon: Flame, label: `${hotCount} Hot Picks`, color: "#ef4444" },
                  { icon: Star, label: `${featuredCount} Featured`, color: "#f59e0b" },
                  { icon: Download, label: "Free Starter Kits", color: "#10b981" },
                  { icon: Globe, label: "20+ Industries", color: "#a855f7" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/5 border border-white/8 px-4 py-2 rounded-full">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </div>
                ))}
                {/* Daily refresh countdown */}
                {countdown && (
                  <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-sm font-medium text-violet-300">New order in {countdown}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── AI-Generated Today's Picks ───────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-bold px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                AI-Generated · Today&apos;s Fresh Ideas
              </div>
              <span className="text-xs text-slate-500">
                {aiLoading && aiIdeas.length === 0
                  ? "Generating 100 fresh ideas across 5 industry groups…"
                  : aiLoading
                  ? `${aiIdeas.length} ideas loaded, generating more…`
                  : `${aiIdeas.length} AI-generated ideas for today`}
              </span>
            </div>

            {aiLoading && aiIdeas.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-[#0d1421] border border-white/5 rounded-2xl p-5 animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/8 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-white/8 rounded w-20" />
                        <div className="h-3 bg-white/8 rounded w-full" />
                      </div>
                    </div>
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-4/5" />
                    <div className="h-3 bg-white/5 rounded w-3/5" />
                    <div className="flex gap-1.5">
                      {[40, 56, 44].map((w) => <div key={w} className={`h-5 bg-white/5 rounded-full w-${w === 40 ? "10" : w === 56 ? "14" : "11"}`} />)}
                    </div>
                    <div className="h-8 bg-indigo-600/20 rounded-xl w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : aiIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {aiIdeas.map((idea, i) => (
                  <IdeaCard key={idea.id} idea={idea} index={i} onGetCode={setSelectedIdea} onReview={setReviewTarget} rating={ratings[idea.id]} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white/2 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
                <p className="text-slate-400 text-sm">AI idea generation failed — retrying with fallback models.</p>
                {aiError && (
                  <p className="text-slate-600 text-xs max-w-xl font-mono bg-black/30 px-3 py-2 rounded-lg">
                    {aiError.slice(0, 200)}
                  </p>
                )}
                <p className="text-slate-600 text-xs">Showing today&apos;s curated set below.</p>
                <button
                  onClick={() => setRetryKey((k) => k + 1)}
                  className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Generation
                </button>
              </div>
            )}
          </div>

          {/* ── Divider ──────────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">100 Curated Ideas · Random Daily Order</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {/* ── Search + Filter bar ───────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas, industries, problems…"
                className="w-full bg-[#0d1421] border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15"}`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="text-xs text-slate-500 self-center ml-1">
              <span className="text-white font-medium">{filtered.length}</span> ideas
            </div>
          </div>

          {/* ── Category pills ────────────────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="flex flex-wrap gap-2 py-1">
                  {CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const active = cat === activeCategory;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${active ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15"}`}
                      >
                        {cat !== "All" && meta && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                        )}
                        {cat === "All" ? "All Industries" : cat}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Ideas grid ────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-slate-400">No ideas match your filters. Try clearing the search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} onGetCode={setSelectedIdea} onReview={setReviewTarget} rating={ratings[idea.id]} />
              ))}
            </div>
          )}

          {/* ── Website Builder ───────────────────────────────────── */}
          <WebsiteBuilderSection />

          {/* ── CTA Banner ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-4 mb-12 rounded-3xl overflow-hidden border border-indigo-500/20 relative"
            style={{ background: "linear-gradient(135deg, #1a1040 0%, #0f1f40 100%)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#6366f130_0%,_transparent_60%)]" />
            <div className="relative px-8 py-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-black text-white mb-2">Have an idea that should be here?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Submit your world-changing AI concept and help 1M builders find their next big project.</p>
              </div>
              <a
                href="/community"
                className="flex-shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/30"
              >
                <Sparkles className="w-4 h-4" />
                Submit Your Idea
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── Access checking overlay (prevents flash while verifying network) */}
      <AnimatePresence>
        {checkingAccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[201] bg-[#070b12]/90 flex items-center justify-center"
          >
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <span className="w-4 h-4 rounded-full border-2 border-indigo-500/40 border-t-indigo-400 animate-spin" />
              Verifying access…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Payment Gate ──────────────────────────────────────────── */}
      <AnimatePresence>
        {locked && !checkingAccess && (
          <PaymentGateModal onGoBack={() => window.history.back()} />
        )}
      </AnimatePresence>

      {/* ── Code Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedIdea && <CodeModal idea={selectedIdea} onClose={() => setSelectedIdea(null)} />}
      </AnimatePresence>

      {/* ── Review Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {reviewTarget && (
          <ReviewModal
            idea={reviewTarget}
            onClose={() => setReviewTarget(null)}
            onSubmitted={handleReviewSubmitted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
