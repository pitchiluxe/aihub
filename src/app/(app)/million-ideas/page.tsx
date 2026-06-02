"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import {
  Lightbulb, Flame, Search, Download, ExternalLink, X,
  Copy, Check, ChevronRight, Sparkles, Zap, Clock, TrendingUp,
  Globe, Code2, FileText, Terminal, Star, ArrowRight, Filter,
  Rocket, DollarSign, Users, Building, Heart, Hammer,
  ShoppingCart, Truck, BookOpen, Briefcase, Leaf,
} from "lucide-react";
import { IDEAS, CATEGORIES, CATEGORY_META, type Idea } from "./ideas-data";

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
function IdeaCard({ idea, index, onGetCode }: { idea: Idea; index: number; onGetCode: (idea: Idea) => void }) {
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

// ─── Website Builder Section ───────────────────────────────────────────────
const SITE_TYPES = [
  { icon: Hammer, label: "Trade Business", desc: "Plumber · Electrician · HVAC · Roofer", color: "#f97316", features: ["Online booking", "Service area map", "Emergency call button", "Review aggregation"] },
  { icon: Heart, label: "Medical Practice", desc: "Doctor · Dentist · Therapist · Clinic", color: "#ef4444", features: ["Appointment booking", "Insurance forms", "Patient chatbot", "After-hours automation"] },
  { icon: Briefcase, label: "Law Firm", desc: "Solo · Boutique · Personal Injury · Family", color: "#6366f1", features: ["Lead qualification bot", "Consultation scheduling", "Case result showcase", "Retainer conversion"] },
  { icon: Sparkles, label: "Restaurant / Cafe", desc: "Any dining concept or food business", color: "#f59e0b", features: ["Online ordering", "Reservation system", "Menu showcase", "Loyalty integration"] },
  { icon: Code2, label: "Freelancer Portfolio", desc: "Developer · Designer · Consultant", color: "#10b981", features: ["Project showcase", "Testimonials", "Contact form", "Calendly integration"] },
];

function WebsiteBuilderSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const [formData, setFormData] = useState({ businessName: "", tagline: "", city: "" });

  const selectedType = selected !== null ? SITE_TYPES[selected] : null;

  return (
    <section className="mt-16 mb-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Globe className="w-3.5 h-3.5" />
            Website Builder
          </div>
          <h2 className="text-3xl font-black text-white mb-3">
            Launch Your Business Online <span className="text-purple-400">in 2 Minutes</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Pick your industry. Fill 3 fields. Get a complete, production-ready website with booking, SEO, and conversion tools — deployed instantly.
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
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${selected === i ? "border-white/20 bg-white/8 shadow-lg" : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/4"}`}
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

        {/* Form + features */}
        <AnimatePresence>
          {selectedType && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="bg-[#0d1421] border border-white/8 rounded-2xl overflow-hidden"
            >
              <div className="p-6 grid md:grid-cols-2 gap-8">
                {/* Left: form */}
                <div>
                  <h3 className="text-base font-bold text-white mb-4">Configure Your Site</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 font-medium mb-1.5 block">Business Name</label>
                      <input
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder={`e.g. "${selectedType.label === "Trade Business" ? "Johnson Plumbing" : selectedType.label === "Medical Practice" ? "Riverside Medical" : selectedType.label === "Law Firm" ? "Webb & Associates" : selectedType.label === "Restaurant / Cafe" ? "The Corner Bistro" : "Alex Rivera Design"}"`}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium mb-1.5 block">Tagline</label>
                      <input
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="Your short value proposition..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium mb-1.5 block">City / Service Area</label>
                      <input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Austin, TX"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const prompt = encodeURIComponent(
                        `Build me a complete ${selectedType.label} website for "${formData.businessName || "My Business"}" in ${formData.city || "my city"}. Tagline: "${formData.tagline || selectedType.desc}". Include: ${selectedType.features.join(", ")}. Use a stunning, never-seen-before UI design — not generic. Production-ready Next.js + Tailwind + shadcn.`
                      );
                      window.location.href = `/agents?prompt=${prompt}`;
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                  >
                    <Zap className="w-4 h-4" />
                    Generate My Website
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: features */}
                <div>
                  <h3 className="text-base font-bold text-white mb-4">What You Get</h3>
                  <div className="space-y-3">
                    {selectedType.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-4 py-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedType.color }} />
                        <span className="text-sm text-slate-300">{f}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-4 py-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-indigo-400" />
                      <span className="text-sm text-slate-300">Full source code — yours forever</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-4 py-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-purple-400" />
                      <span className="text-sm text-slate-300">One-click Vercel deployment</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function MillionIdeasPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return IDEAS.filter((idea) => {
      const matchCat = activeCategory === "All" || idea.category === activeCategory;
      const matchQ = !q || idea.title.toLowerCase().includes(q) || idea.problem.toLowerCase().includes(q) || idea.category.toLowerCase().includes(q) || idea.tagline.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [activeCategory, searchQuery]);

  const hotCount = IDEAS.filter((i) => i.isHot).length;
  const featuredCount = IDEAS.filter((i) => i.isFeatured).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#070b12]">
      <TopBar title="1M Ideas" description="World-changing AI tools waiting to be built" />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
              </div>
            </div>
          </motion.div>

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
                <IdeaCard key={idea.id} idea={idea} index={i} onGetCode={setSelectedIdea} />
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

      {/* ── Code Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedIdea && <CodeModal idea={selectedIdea} onClose={() => setSelectedIdea(null)} />}
      </AnimatePresence>
    </div>
  );
}
