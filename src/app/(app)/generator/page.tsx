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
  Loader, Download, Share2, Sparkles, Code, Zap, Wand2,
  Copy, Check, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type TabType = "skill" | "agent" | "prompt";

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

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<TabType>("skill");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedItem[]>([]);
  const [preview, setPreview] = useState<GeneratedItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Prompt-specific state
  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    task: "",
    role: "",
    context: "",
    format: "Detailed paragraphs",
    tone: "Professional",
  });

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, prompt }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        name: data.name,
        type: activeTab,
        description: data.description,
        code: data.code,
        createdAt: new Date(),
        prompt,
        archivedId: data.archivedId,
        shareUrl: data.shareUrl,
      };
      setGenerated((prev) => [newItem, ...prev]);
      setPreview(newItem);
      setPrompt("");
      if (data.archivedId) {
        toast.success(`${activeTab === "skill" ? "Skill" : "Agent"} created & auto-archived!`, { duration: 4000 });
      } else {
        toast.success(`${activeTab === "skill" ? "Skill" : "Agent"} generated!`);
      }
    } catch {
      toast.error("Failed to generate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGeneratePrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!promptConfig.task.trim()) {
      toast.error("Please describe the task");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "prompt", prompt: JSON.stringify(promptConfig) }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        name: data.name,
        type: "prompt",
        description: data.description,
        code: data.code,
        createdAt: new Date(),
        prompt: promptConfig.task,
        archivedId: data.archivedId,
        shareUrl: data.shareUrl,
      };
      setGenerated((prev) => [newItem, ...prev]);
      setPreview(newItem);
      toast.success("Prompt generated and ready to use!");
    } catch {
      toast.error("Failed to generate prompt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyPrompt(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload(item: GeneratedItem) {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, format: "zip" }),
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name}-${item.type}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch {
      toast.error("Download failed");
    }
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
      toast.success("Shared! Link copied to clipboard.");
    } catch {
      toast.error("Failed to share");
    }
  }

  const isPromptTab = activeTab === "prompt";
  const tabItems = generated.filter(i => i.type === activeTab);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="Skills & Agents Generator"
        description="Create custom AI skills, agents, and optimized prompts with natural language"
      />

      <div className="flex-1 p-3 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1 border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">
                  Create {activeTab === "skill" ? "Skill" : activeTab === "agent" ? "Agent" : "Prompt"}
                </h3>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="mb-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="skill" className="gap-1.5 text-xs">
                      <Code className="h-3.5 w-3.5" />
                      Skill
                    </TabsTrigger>
                    <TabsTrigger value="agent" className="gap-1.5 text-xs">
                      <Zap className="h-3.5 w-3.5" />
                      Agent
                    </TabsTrigger>
                    <TabsTrigger value="prompt" className="gap-1.5 text-xs">
                      <Wand2 className="h-3.5 w-3.5" />
                      Prompt
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Skill / Agent Form */}
              {!isPromptTab && (
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

              {/* Prompt Generator Form */}
              {isPromptTab && (
                <form onSubmit={handleGeneratePrompt} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Task Description *
                    </label>
                    <Textarea
                      placeholder="e.g., Write a detailed analysis of a company's competitive positioning..."
                      value={promptConfig.task}
                      onChange={(e) => setPromptConfig(p => ({ ...p, task: e.target.value }))}
                      className="min-h-[80px] resize-none text-sm"
                      disabled={isGenerating}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Role / Persona
                    </label>
                    <input
                      placeholder="e.g., Senior business analyst, Python expert..."
                      value={promptConfig.role}
                      onChange={(e) => setPromptConfig(p => ({ ...p, role: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      disabled={isGenerating}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Context
                    </label>
                    <Textarea
                      placeholder="Additional context, constraints, or background information..."
                      value={promptConfig.context}
                      onChange={(e) => setPromptConfig(p => ({ ...p, context: e.target.value }))}
                      className="min-h-[60px] resize-none text-sm"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Output Format
                      </label>
                      <div className="relative">
                        <select
                          value={promptConfig.format}
                          onChange={(e) => setPromptConfig(p => ({ ...p, format: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring appearance-none pr-8"
                          disabled={isGenerating}
                        >
                          {FORMAT_OPTIONS.map(f => <option key={f}>{f}</option>)}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Tone
                      </label>
                      <div className="relative">
                        <select
                          value={promptConfig.tone}
                          onChange={(e) => setPromptConfig(p => ({ ...p, tone: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring appearance-none pr-8"
                          disabled={isGenerating}
                        >
                          {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">QUICK TEMPLATES</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PROMPT_TEMPLATES.map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => setPromptConfig(p => ({
                            ...p,
                            task: t.task,
                            role: t.role,
                            tone: t.tone,
                          }))}
                          className="text-left p-2 rounded-lg bg-muted hover:bg-muted/80 text-xs transition-all"
                        >
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

              {/* Recent Generated */}
              {tabItems.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">RECENT</p>
                  <div className="space-y-2">
                    {tabItems.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPreview(item)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                          preview?.id === item.id
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-muted-foreground truncate">{item.description.slice(0, 50)}...</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            {preview ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={preview.id}
              >
                <Card className="h-full border-2 border-primary/20">
                  <CardContent className="p-6 space-y-4 h-full flex flex-col">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{preview.name}</h3>
                          <p className="text-sm text-muted-foreground">{preview.description}</p>
                          {preview.archivedId && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                              ✓ Auto-archived and ready to share
                            </p>
                          )}
                        </div>
                        <Badge variant={preview.type === "prompt" ? "outline" : preview.type === "skill" ? "default" : "secondary"}>
                          {preview.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(preview.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Content Preview */}
                    {preview.type === "prompt" ? (
                      <div className="flex-1 relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl border border-violet-200 dark:border-violet-800 p-5 overflow-auto">
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-mono">
                          {preview.code}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 bg-muted rounded-lg p-4 overflow-auto">
                        <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words">
                          {preview.code.slice(0, 1000)}
                          {preview.code.length > 1000 && "..."}
                        </pre>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t flex-wrap">
                      {preview.type === "prompt" ? (
                        <>
                          <Button
                            onClick={() => handleCopyPrompt(preview.code)}
                            className="flex-1 gap-2"
                            size="sm"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Copy Prompt"}
                          </Button>
                          <Button
                            onClick={() => handleDownload(preview)}
                            variant="outline"
                            className="flex-1 gap-2"
                            size="sm"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleDownload(preview)}
                            variant="default"
                            className="flex-1 gap-2"
                            size="sm"
                          >
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
                            <Button
                              onClick={() => handleShare(preview)}
                              variant="outline"
                              className="flex-1 gap-2"
                              size="sm"
                            >
                              <Share2 className="h-4 w-4" />
                              Share
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Original Prompt */}
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {preview.type === "prompt" ? "TASK" : "PROMPT"}
                      </p>
                      <p className="text-xs">{preview.prompt}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full border-2 border-dashed border-muted-foreground/20">
                <CardContent className="p-6 flex items-center justify-center h-full text-center">
                  <div>
                    {isPromptTab ? (
                      <Wand2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    ) : (
                      <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    )}
                    <p className="text-muted-foreground">
                      {isPromptTab
                        ? "Fill in the task details to generate an optimized prompt"
                        : `Generate a ${activeTab} to see the preview`}
                    </p>
                    {isPromptTab && (
                      <p className="text-xs text-muted-foreground/60 mt-2 max-w-xs mx-auto">
                        Your prompt will be crafted with best practices — clear role, precise instructions, and proper constraints
                      </p>
                    )}
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
