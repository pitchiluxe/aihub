"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download, Share2, Sparkles, Code, Zap, Wand2,
  Copy, Check, ChevronDown, Lightbulb, Rocket,
  Target, Cpu, DollarSign, Star, ArrowRight, Shuffle, FileCode2,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useArchiveStore } from "@/store/archive";

type TabType = "skill" | "agent" | "prompt" | "idea" | "claudemd";

interface GeneratedItem {
  id: string;
  name: string;
  type: TabType;
  description: string;
  code: string;
  createdAt: Date;
  prompt: string;
  archivedId?: string;
  shareUrl?: string;
}

interface PromptConfig {
  task: string;
  role: string;
  context: string;
  format: string;
  tone: string;
}

interface IdeaConfig {
  category: string;
  domain: string;
  scale: string;
}

interface ClaudeMdConfig {
  description: string;
  stack: string;
  commands: string;
  conventions: string;
}

interface IdeaResult {
  name: string;
  tagline: string;
  category: string;
  problem: string;
  solution: string;
  features: string[];
  techStack: string[];
  monetization: string;
  uniqueAngle: string;
  promptForGenerator: string;
}

const FORMAT_OPTIONS = [
  "Detailed paragraphs",
  "Step-by-step list",
  "JSON output",
  "Markdown document",
  "Code with comments",
  "Bullet points",
  "Table format",
];

const TONE_OPTIONS = [
  "Professional",
  "Technical / Expert",
  "Casual / Conversational",
  "Creative / Imaginative",
  "Concise / Direct",
  "Academic / Formal",
];

const PROMPT_TEMPLATES = [
  { label: "Content Writer", task: "Write SEO-optimized blog posts on AI topics", role: "Expert content writer", tone: "Professional" },
  { label: "Code Reviewer", task: "Review code for bugs, security issues, and best practices", role: "Senior software engineer", tone: "Technical / Expert" },
  { label: "Research Analyst", task: "Summarize and analyze AI research papers", role: "AI research analyst", tone: "Academic / Formal" },
  { label: "Product Manager", task: "Generate product requirements and user stories", role: "Senior product manager", tone: "Professional" },
];

const IDEA_CATEGORIES = [
  "Surprise Me 🎲",
  "Web App",
  "SaaS Platform",
  "AI Tool",
  "Developer Tool",
  "Mobile App",
  "Browser Extension",
  "API / SDK",
  "Automation Tool",
];

const IDEA_SCALES = ["Weekend Hack", "Full Product", "Enterprise Scale"];

const IDEA_DOMAINS = [
  "Developer Productivity", "Healthcare", "FinTech", "Education",
  "E-commerce", "Content Creation", "Data Analytics", "Cybersecurity",
  "Legal Tech", "HR Tech", "Gaming", "Real Estate",
];

function parseIdea(json: string): IdeaResult | null {
  try {
    const match = json.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  } catch {
    return null;
  }
}

export default function GeneratorPage() {
  const { addItem: saveToArchive } = useArchiveStore();

  const [activeTab, setActiveTab] = useState<TabType>("skill");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedItem[]>([]);
  const [preview, setPreview] = useState<GeneratedItem | null>(null);
  const [copied, setCopied] = useState(false);

  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    task: "",
    role: "",
    context: "",
    format: "Detailed paragraphs",
    tone: "Professional",
  });

  const [ideaConfig, setIdeaConfig] = useState<IdeaConfig>({
    category: "Surprise Me 🎲",
    domain: "",
    scale: "Full Product",
  });

  const [claudeMdConfig, setClaudeMdConfig] = useState<ClaudeMdConfig>({
    description: "",
    stack: "",
    commands: "",
    conventions: "",
  });

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, prompt }),
      });
      if (!response.ok) throw new Error("Generation failed");
      if (!response.body) throw new Error("No response body");

      // Parse SSE stream — server pipes OpenRouter chunks directly to avoid Vercel timeout
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            fullContent += parsed.choices?.[0]?.delta?.content ?? "";
          } catch { /* partial chunk, skip */ }
        }
      }

      if (!fullContent.trim()) throw new Error("Empty response from model");

      const contentLines = fullContent.split("\n");
      const name = contentLines[0].replace(/^#+\s*/, "").trim() || `Generated ${activeTab}`;
      const description = contentLines.slice(1, 3).join(" ").replace(/\s+/g, " ").slice(0, 200);

      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        name,
        type: activeTab,
        description,
        code: fullContent,
        createdAt: new Date(),
        prompt,
      };
      setGenerated((prev) => [newItem, ...prev]);
      setPreview(newItem);
      setPrompt("");
      saveToArchive({ name, type: activeTab as "skill" | "agent", description, code: fullContent, prompt });
      toast.success(`${activeTab === "skill" ? "Skill" : "Agent"} generated & saved to archive!`, { duration: 3000 });
    } catch {
      toast.error("Failed to generate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function readSSEContent(response: Response): Promise<string> {
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          content += parsed.choices?.[0]?.delta?.content ?? "";
        } catch { /* partial chunk */ }
      }
    }
    return content;
  }

  async function handleGeneratePrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!promptConfig.task.trim()) { toast.error("Please describe the task"); return; }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "prompt", prompt: JSON.stringify(promptConfig) }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const code = await readSSEContent(response);
      if (!code.trim()) throw new Error("Empty response");
      const name = `Prompt: ${promptConfig.task.slice(0, 50)}`;
      const description = "AI-optimized prompt ready for immediate use";
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        name,
        type: "prompt",
        description,
        code,
        createdAt: new Date(),
        prompt: promptConfig.task,
      };
      setGenerated((prev) => [newItem, ...prev]);
      setPreview(newItem);
      saveToArchive({ name, type: "prompt", description, code, prompt: promptConfig.task });
      toast.success("Prompt generated & saved to archive!");
    } catch {
      toast.error("Failed to generate prompt.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateIdea(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const configStr = JSON.stringify({
        category: ideaConfig.category === "Surprise Me 🎲" ? "any" : ideaConfig.category,
        domain: ideaConfig.domain || "any",
        scale: ideaConfig.scale,
      });
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "idea", prompt: configStr }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const code = await readSSEContent(response);
      if (!code.trim()) throw new Error("Empty response");
      let name = "Original Idea";
      let description = "A never-before-seen product concept";
      try {
        const jsonMatch = code.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        if (parsed?.name) name = parsed.name;
        if (parsed?.tagline) description = parsed.tagline;
      } catch { /* use defaults */ }
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        name,
        type: "idea",
        description,
        code,
        createdAt: new Date(),
        prompt: ideaConfig.domain || ideaConfig.category,
      };
      setGenerated((prev) => [newItem, ...prev]);
      setPreview(newItem);
      saveToArchive({ name, type: "idea", description, code, prompt: ideaConfig.domain || ideaConfig.category });
      toast.success("New idea generated & saved to archive! 🚀");
    } catch {
      toast.error("Failed to generate idea.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateClaudeMd(e: React.FormEvent) {
    e.preventDefault();
    if (!claudeMdConfig.description.trim()) { toast.error("Describe your project"); return; }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "claudemd", prompt: JSON.stringify(claudeMdConfig) }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const code = await readSSEContent(response);
      if (!code.trim()) throw new Error("Empty response");
      const name = `CLAUDE.md — ${claudeMdConfig.description.slice(0, 45)}`;
      const description = "Claude Code project instructions file";
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        name,
        type: "claudemd",
        description,
        code,
        createdAt: new Date(),
        prompt: claudeMdConfig.description,
      };
      setGenerated((prev) => [newItem, ...prev]);
      setPreview(newItem);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      saveToArchive({ name, type: "skill" as any, description, code, prompt: claudeMdConfig.description });
      toast.success("CLAUDE.md generated & saved to archive!");
    } catch {
      toast.error("Failed to generate CLAUDE.md.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleUseIdeaAsPrompt(idea: IdeaResult) {
    setPromptConfig(p => ({
      ...p,
      task: idea.promptForGenerator,
      role: "Senior full-stack developer",
      tone: "Technical / Expert",
    }));
    setActiveTab("prompt");
    toast.success("Idea loaded into Prompt Generator!");
  }

  async function handleCopyPrompt(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload(item: GeneratedItem) {
    const ext = item.type === "idea" ? "json" : "md";
    const filename = item.type === "claudemd"
      ? "CLAUDE.md"
      : `${item.name.toLowerCase().replace(/\s+/g, "-")}-${item.type}.${ext}`;
    const blob = new Blob([item.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  }

  async function handleShare(item: GeneratedItem) {
    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Archive failed");
      const data = await response.json();
      const shareUrl = `${window.location.origin}/gallery/${data.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to share");
    }
  }

  const tabItems = generated.filter(i => i.type === activeTab);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="Skills & Agents Generator"
        description="Create custom AI skills, agents, optimized prompts, and original product ideas"
      />

      <div className="flex-1 p-3 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Input Panel ── */}
          <Card className="lg:col-span-1 border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">
                  {activeTab === "skill" ? "Create Skill"
                    : activeTab === "agent" ? "Create Agent"
                    : activeTab === "prompt" ? "Generate Prompt"
                    : activeTab === "claudemd" ? "Generate CLAUDE.md"
                    : "Generate Idea"}
                </h3>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="mb-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="skill" className="gap-1 text-xs px-1">
                      <Code className="h-3.5 w-3.5" />
                      Skill
                    </TabsTrigger>
                    <TabsTrigger value="agent" className="gap-1 text-xs px-1">
                      <Zap className="h-3.5 w-3.5" />
                      Agent
                    </TabsTrigger>
                    <TabsTrigger value="prompt" className="gap-1 text-xs px-1">
                      <Wand2 className="h-3.5 w-3.5" />
                      Prompt
                    </TabsTrigger>
                    <TabsTrigger value="idea" className="gap-1 text-xs px-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Idea
                    </TabsTrigger>
                    <TabsTrigger value="claudemd" className="gap-1 text-xs px-1">
                      <FileCode2 className="h-3.5 w-3.5" />
                      MD
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* ── Skill / Agent Form ── */}
              {(activeTab === "skill" || activeTab === "agent") && (
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Describe your {activeTab}
                    </label>
                    <Textarea
                      placeholder={
                        activeTab === "skill"
                          ? "e.g., 'Create a skill that analyzes sentiment in AI news articles'"
                          : "e.g., 'Create an agent that searches AI research papers and generates insights'"
                      }
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] resize-none text-sm"
                      disabled={isGenerating}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isGenerating} size="lg">
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate"}
                  </Button>
                </form>
              )}

              {/* ── Prompt Generator Form ── */}
              {activeTab === "prompt" && (
                <form onSubmit={handleGeneratePrompt} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Task Description *</label>
                    <Textarea
                      placeholder="e.g., Write a detailed competitive analysis comparing two SaaS products..."
                      value={promptConfig.task}
                      onChange={(e) => setPromptConfig(p => ({ ...p, task: e.target.value }))}
                      className="min-h-[80px] resize-none text-sm"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Role / Persona</label>
                    <input
                      placeholder="e.g., Senior business analyst, Python expert..."
                      value={promptConfig.role}
                      onChange={(e) => setPromptConfig(p => ({ ...p, role: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Context</label>
                    <Textarea
                      placeholder="Additional context, constraints, or background..."
                      value={promptConfig.context}
                      onChange={(e) => setPromptConfig(p => ({ ...p, context: e.target.value }))}
                      className="min-h-[60px] resize-none text-sm"
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Format</label>
                      <div className="relative">
                        <select value={promptConfig.format} onChange={(e) => setPromptConfig(p => ({ ...p, format: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring appearance-none pr-8" disabled={isGenerating}>
                          {FORMAT_OPTIONS.map(f => <option key={f}>{f}</option>)}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tone</label>
                      <div className="relative">
                        <select value={promptConfig.tone} onChange={(e) => setPromptConfig(p => ({ ...p, tone: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring appearance-none pr-8" disabled={isGenerating}>
                          {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">QUICK TEMPLATES</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PROMPT_TEMPLATES.map((t) => (
                        <button key={t.label} type="button"
                          onClick={() => setPromptConfig(p => ({ ...p, task: t.task, role: t.role, tone: t.tone }))}
                          className="text-left p-2 rounded-lg bg-muted hover:bg-muted/80 text-xs transition-all">
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isGenerating} size="lg">
                    <Wand2 className="h-4 w-4" />
                    {isGenerating ? "Crafting Prompt..." : "Generate Prompt"}
                  </Button>
                </form>
              )}

              {/* ── Idea Generator Form ── */}
              {activeTab === "idea" && (
                <form onSubmit={handleGenerateIdea} className="space-y-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold mb-1">🚀 Never-Before-Seen Ideas</p>
                    <p className="text-amber-700 dark:text-amber-400">Generate original product ideas you can build into real apps, websites, or SaaS products.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                    <div className="relative">
                      <select value={ideaConfig.category} onChange={(e) => setIdeaConfig(p => ({ ...p, category: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring appearance-none pr-8" disabled={isGenerating}>
                        {IDEA_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Domain / Niche <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      placeholder="e.g., healthcare, fintech, developer tools..."
                      value={ideaConfig.domain}
                      onChange={(e) => setIdeaConfig(p => ({ ...p, domain: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      disabled={isGenerating}
                      list="domain-suggestions"
                    />
                    <datalist id="domain-suggestions">
                      {IDEA_DOMAINS.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Scale</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {IDEA_SCALES.map(s => (
                        <button key={s} type="button"
                          onClick={() => setIdeaConfig(p => ({ ...p, scale: s }))}
                          className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${ideaConfig.scale === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 gap-2 ai-gradient border-0" disabled={isGenerating} size="lg">
                      <Lightbulb className="h-4 w-4" />
                      {isGenerating ? "Thinking..." : "Generate Idea"}
                    </Button>
                    <Button type="button" variant="outline" size="lg" disabled={isGenerating}
                      onClick={() => {
                        const randCat = IDEA_CATEGORIES[Math.floor(Math.random() * (IDEA_CATEGORIES.length - 1)) + 1];
                        const randDomain = IDEA_DOMAINS[Math.floor(Math.random() * IDEA_DOMAINS.length)];
                        const randScale = IDEA_SCALES[Math.floor(Math.random() * IDEA_SCALES.length)];
                        setIdeaConfig({ category: randCat, domain: randDomain, scale: randScale });
                      }}
                      title="Randomize">
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}

              {/* ── CLAUDE.md Generator Form ── */}
              {activeTab === "claudemd" && (
                <form onSubmit={handleGenerateClaudeMd} className="space-y-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800 text-xs text-violet-800 dark:text-violet-300">
                    <p className="font-semibold mb-1">🤖 CLAUDE.md Generator</p>
                    <p className="text-violet-700 dark:text-violet-400">Generate a CLAUDE.md file that gives Claude Code full context about your project — conventions, commands, architecture, and rules.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Project Description *</label>
                    <Textarea
                      placeholder="e.g., Next.js 15 SaaS app for AI content generation with Supabase auth, OpenRouter API, deployed on Vercel..."
                      value={claudeMdConfig.description}
                      onChange={(e) => setClaudeMdConfig(p => ({ ...p, description: e.target.value }))}
                      className="min-h-[90px] resize-none text-sm"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tech Stack</label>
                    <input
                      placeholder="e.g., Next.js, TypeScript, TailwindCSS, Supabase, OpenRouter..."
                      value={claudeMdConfig.stack}
                      onChange={(e) => setClaudeMdConfig(p => ({ ...p, stack: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Key Commands</label>
                    <input
                      placeholder="e.g., npm run dev, npm run build, npm test..."
                      value={claudeMdConfig.commands}
                      onChange={(e) => setClaudeMdConfig(p => ({ ...p, commands: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Conventions / Preferences</label>
                    <Textarea
                      placeholder="e.g., Always use TypeScript strict mode, prefer server components, no default exports..."
                      value={claudeMdConfig.conventions}
                      onChange={(e) => setClaudeMdConfig(p => ({ ...p, conventions: e.target.value }))}
                      className="min-h-[60px] resize-none text-sm"
                      disabled={isGenerating}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 ai-gradient border-0" disabled={isGenerating} size="lg">
                    <FileCode2 className="h-4 w-4" />
                    {isGenerating ? "Generating CLAUDE.md..." : "Generate CLAUDE.md"}
                  </Button>
                </form>
              )}

              {/* Recent */}
              {tabItems.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">RECENT</p>
                  <div className="space-y-2">
                    {tabItems.slice(0, 5).map((item) => (
                      <button key={item.id} onClick={() => setPreview(item)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all ${preview?.id === item.id ? "bg-primary/10 border border-primary/20" : "bg-muted hover:bg-muted/80"}`}>
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-muted-foreground truncate">{item.description.slice(0, 50)}...</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Preview Panel ── */}
          <div className="lg:col-span-2">
            {preview ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={preview.id} className="h-full">
                <Card className="h-full border-2 border-primary/20">
                  <CardContent className="p-6 space-y-4 h-full flex flex-col">

                    {/* ── IDEA preview ── */}
                    {preview.type === "idea" && (() => {
                      const idea = parseIdea(preview.code);
                      if (!idea) return (
                        <div className="flex-1 bg-[#1e1e2e] rounded-xl p-5 overflow-auto">
                          <pre className="text-sm text-[#cdd6f4] whitespace-pre-wrap font-mono">{preview.code}</pre>
                        </div>
                      );
                      return (
                        <div className="flex-1 flex flex-col gap-4 overflow-auto">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Rocket className="h-5 w-5 text-amber-500" />
                                <h2 className="text-xl font-bold">{idea.name}</h2>
                                <Badge variant="secondary" className="text-xs">{idea.category}</Badge>
                              </div>
                              <p className="text-muted-foreground text-sm italic">"{idea.tagline}"</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700">Idea</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {/* Problem */}
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Target className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Problem</p>
                              </div>
                              <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{idea.problem}</p>
                            </div>
                            {/* Solution */}
                            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Solution</p>
                              </div>
                              <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">{idea.solution}</p>
                            </div>
                          </div>

                          {/* Features */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Features</p>
                            <div className="space-y-1.5">
                              {(idea.features ?? []).map((f, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                  <p className="text-xs leading-relaxed">{f}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tech Stack + Monetization */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tech Stack</p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(idea.techStack ?? []).map(t => (
                                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monetization</p>
                              </div>
                              <p className="text-xs text-muted-foreground">{idea.monetization}</p>
                            </div>
                          </div>

                          {/* Unique Angle */}
                          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Star className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                              <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wider">Why Nobody Has Built This</p>
                            </div>
                            <p className="text-xs text-violet-800 dark:text-violet-300">{idea.uniqueAngle}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button onClick={() => handleUseIdeaAsPrompt(idea)} className="flex-1 gap-2 ai-gradient border-0" size="sm">
                              <ArrowRight className="h-4 w-4" />
                              Generate Prompt for This Idea
                            </Button>
                            <Button onClick={() => handleCopyPrompt(JSON.stringify(idea, null, 2))} variant="outline" className="gap-2" size="sm">
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              Copy
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── PROMPT preview ── */}
                    {preview.type === "prompt" && (
                      <>
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{preview.name}</h3>
                              <p className="text-sm text-muted-foreground">{preview.description}</p>
                            </div>
                            <Badge variant="outline">prompt</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Created {new Date(preview.createdAt).toLocaleDateString()}</p>
                        </div>

                        {/* Dark high-contrast code block */}
                        <div className="flex-1 bg-[#1e1e2e] rounded-xl border border-border overflow-auto">
                          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                            <span className="text-xs text-white/50 font-mono">Generated Prompt</span>
                            <button onClick={() => handleCopyPrompt(preview.code)} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                              {copied ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy className="h-3 w-3" />Copy</>}
                            </button>
                          </div>
                          <pre className="p-5 text-sm text-[#cdd6f4] whitespace-pre-wrap font-mono leading-relaxed">
                            {preview.code}
                          </pre>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button onClick={() => handleCopyPrompt(preview.code)} className="flex-1 gap-2" size="sm">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Copy Prompt"}
                          </Button>
                          <Button onClick={() => handleDownload(preview)} variant="outline" className="flex-1 gap-2" size="sm">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">TASK</p>
                          <p className="text-xs">{preview.prompt}</p>
                        </div>
                      </>
                    )}

                    {/* ── SKILL / AGENT preview ── */}
                    {(preview.type === "skill" || preview.type === "agent") && (
                      <>
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{preview.name}</h3>
                              <p className="text-sm text-muted-foreground">{preview.description}</p>
                              {preview.archivedId && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ Auto-archived and ready to share</p>}
                            </div>
                            <Badge variant={preview.type === "skill" ? "default" : "secondary"}>{preview.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Created {new Date(preview.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex-1 bg-[#1e1e2e] rounded-xl border border-border overflow-auto">
                          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                            <span className="text-xs text-white/50 font-mono">{preview.type === "skill" ? "SKILL.md" : "agent-config.md"}</span>
                            <button onClick={() => handleCopyPrompt(preview.code)} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                              {copied ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy className="h-3 w-3" />Copy</>}
                            </button>
                          </div>
                          <pre className="p-4 text-xs font-mono text-[#cdd6f4] whitespace-pre-wrap break-words">
                            {preview.code.slice(0, 2000)}
                            {preview.code.length > 2000 && "\n\n... (truncated — download for full content)"}
                          </pre>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button onClick={() => handleDownload(preview)} className="flex-1 gap-2" size="sm">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          {preview.archivedId ? (
                            <Link href="/archive" className="flex-1">
                              <Button variant="outline" className="w-full gap-2" size="sm">
                                <Share2 className="h-4 w-4" />
                                View in Archive
                              </Button>
                            </Link>
                          ) : (
                            <Button onClick={() => handleShare(preview)} variant="outline" className="flex-1 gap-2" size="sm">
                              <Share2 className="h-4 w-4" />
                              Share
                            </Button>
                          )}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">PROMPT</p>
                          <p className="text-xs">{preview.prompt}</p>
                        </div>
                      </>
                    )}

                    {/* ── CLAUDE.md preview ── */}
                    {preview.type === "claudemd" && (
                      <>
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileCode2 className="h-5 w-5 text-violet-500" />
                                <h3 className="text-lg font-semibold">CLAUDE.md</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">{preview.description}</p>
                            </div>
                            <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 border-violet-300 dark:border-violet-700">CLAUDE.md</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Created {new Date(preview.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex-1 bg-[#1e1e2e] rounded-xl border border-border overflow-auto">
                          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                            <span className="text-xs text-white/50 font-mono">CLAUDE.md</span>
                            <button onClick={() => handleCopyPrompt(preview.code)} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                              {copied ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy className="h-3 w-3" />Copy</>}
                            </button>
                          </div>
                          <pre className="p-5 text-sm text-[#cdd6f4] whitespace-pre-wrap font-mono leading-relaxed">
                            {preview.code}
                          </pre>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button onClick={() => handleDownload(preview)} className="flex-1 gap-2 ai-gradient border-0" size="sm">
                            <Download className="h-4 w-4" />
                            Download CLAUDE.md
                          </Button>
                          <Button onClick={() => handleCopyPrompt(preview.code)} variant="outline" className="flex-1 gap-2" size="sm">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-1">HOW TO USE</p>
                          <p className="text-xs text-violet-800 dark:text-violet-300">Place this file at the root of your project as <code className="bg-violet-100 dark:bg-violet-900 px-1 rounded">CLAUDE.md</code>. Claude Code reads it automatically before every task.</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full border-2 border-dashed border-muted-foreground/20 min-h-[400px]">
                <CardContent className="p-6 flex items-center justify-center h-full text-center">
                  <div>
                    {activeTab === "idea" ? (
                      <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    ) : activeTab === "prompt" ? (
                      <Wand2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    ) : activeTab === "claudemd" ? (
                      <FileCode2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    ) : (
                      <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    )}
                    <p className="text-muted-foreground font-medium">
                      {activeTab === "idea" ? "Your next big idea is one click away"
                        : activeTab === "prompt" ? "Fill in the task details to generate an optimized prompt"
                        : activeTab === "claudemd" ? "Describe your project to generate a CLAUDE.md"
                        : `Generate a ${activeTab} to see the preview`}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2 max-w-xs mx-auto">
                      {activeTab === "idea"
                        ? "Generate original product ideas, then use them in the Prompt Generator to get a build-ready brief"
                        : activeTab === "prompt"
                        ? "Your prompt will be engineered with best practices — clear role, precise task, proper constraints"
                        : activeTab === "claudemd"
                        ? "CLAUDE.md tells Claude Code everything about your project — drop it in your repo root and it's read automatically"
                        : "Generated items are automatically archived and ready to share"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
