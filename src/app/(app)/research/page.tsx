"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResearchPaper } from "@/types";
import {
  Search, ExternalLink, BookOpen, Brain, Sparkles, X,
  Bookmark, BookmarkCheck, Send, Quote, Calendar,
  RefreshCw, Loader2, ChevronRight, FlaskConical, Zap,
  Users, TrendingUp, Filter, LayoutGrid, List,
} from "lucide-react";
import toast from "react-hot-toast";

const TOPICS = [
  { label: "LLMs",           query: "large language models",          emoji: "🧠" },
  { label: "AI Agents",      query: "AI agents autonomous",           emoji: "🤖" },
  { label: "RAG",            query: "retrieval augmented generation",  emoji: "🔍" },
  { label: "Reasoning",      query: "chain of thought reasoning LLM",  emoji: "💭" },
  { label: "Alignment",      query: "AI alignment safety RLHF",        emoji: "🛡️" },
  { label: "Multimodal",     query: "multimodal vision language",       emoji: "👁️" },
  { label: "Fine-tuning",    query: "LLM fine-tuning instruction",      emoji: "🎯" },
  { label: "Code Gen",       query: "code generation LLM programming",  emoji: "💻" },
  { label: "Transformers",   query: "transformer architecture attention",emoji: "⚡" },
  { label: "Embeddings",     query: "text embeddings semantic search",  emoji: "📐" },
  { label: "Robotics",       query: "embodied AI robotics LLM",         emoji: "🦾" },
  { label: "Healthcare AI",  query: "medical AI clinical LLM",          emoji: "🏥" },
  { label: "MoE",            query: "mixture of experts sparse LLM",    emoji: "🌐" },
  { label: "RL & RLHF",      query: "reinforcement learning from human feedback", emoji: "🏆" },
  { label: "Diffusion",      query: "diffusion models generative AI",   emoji: "🎨" },
];

const SORT_OPTIONS = [
  { value: "recent",  label: "Most Recent",  icon: Calendar },
  { value: "cited",   label: "Most Cited",   icon: Quote },
  { value: "trending",label: "Trending",     icon: TrendingUp },
] as const;

type SortOption = "recent" | "cited" | "trending";

interface SavedPaper { id: string; title: string; url: string; savedAt: string; }

function getSaved(): SavedPaper[] {
  try { return JSON.parse(localStorage.getItem("aihub-saved-papers") ?? "[]"); } catch { return []; }
}
function setSaved(papers: SavedPaper[]) {
  localStorage.setItem("aihub-saved-papers", JSON.stringify(papers));
}

export default function ResearchPage() {
  const [papers, setPapers]         = useState<ResearchPaper[]>([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState("large language models");
  const [activeQuery, setActiveQuery] = useState("large language models");
  const [activeTopic, setActiveTopic] = useState("LLMs");
  const [sortBy, setSortBy]         = useState<SortOption>("recent");
  const [viewMode, setViewMode]     = useState<"grid" | "list">("grid");
  const [selected, setSelected]     = useState<ResearchPaper | null>(null);
  const [saved, setSavedState]      = useState<SavedPaper[]>([]);
  const [showSaved, setShowSaved]   = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => { setSavedState(getSaved()); }, []);

  const loadPapers = useCallback(async (q: string) => {
    setLoading(true);
    setExplanation(null);
    setAiBrief(null);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(q)}&limit=60`);
      const data = await res.json();
      let result: ResearchPaper[] = data.papers ?? [];
      if (sortBy === "cited") result = [...result].sort((a, b) => (b.citations ?? 0) - (a.citations ?? 0));
      setPapers(result);
      // Generate AI research brief in parallel
      generateAIBrief(q, result.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  async function generateAIBrief(topic: string, topPapers: ResearchPaper[]) {
    setBriefLoading(true);
    try {
      const paperContext = topPapers.length > 0
        ? `\n\nTop recent papers on this topic:\n${topPapers.map((p, i) =>
            `${i + 1}. "${p.title}" — ${p.source} (${p.publishedAt?.slice(0, 7) ?? "recent"})\n   ${p.abstract?.slice(0, 200) ?? ""}`
          ).join("\n\n")}`
        : "";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openrouter",
          model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          messages: [
            {
              role: "system",
              content: `You are an expert AI research analyst. When given a research topic, provide a concise intelligence brief covering the state of the field. Use markdown with short sections. Be specific with names, papers, and numbers.`,
            },
            {
              role: "user",
              content: `Give me a research intelligence brief on: "${topic}"${paperContext}

Format as:
## 🔬 Field Overview (2-3 sentences on current state)
## 🚀 Key Breakthroughs (3 bullet points, recent advances)
## 🔥 Hot Research Directions (3 bullet points)
## 📌 What to Read First (2-3 recommended starting points)

Keep it concise and actionable for AI practitioners.`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.content) setAiBrief(data.content);
    } catch { /* brief is optional */ }
    finally { setBriefLoading(false); }
  }

  useEffect(() => { loadPapers(activeQuery); }, [activeQuery, loadPapers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveTopic("");
    setActiveQuery(query);
  }

  function selectTopic(t: typeof TOPICS[0]) {
    setActiveTopic(t.label);
    setQuery(t.query);
    setActiveQuery(t.query);
  }

  function toggleSave(paper: ResearchPaper) {
    const current = getSaved();
    const exists = current.find(p => p.id === paper.id);
    let updated: SavedPaper[];
    if (exists) {
      updated = current.filter(p => p.id !== paper.id);
      toast.success("Removed from saved");
    } else {
      updated = [{ id: paper.id, title: paper.title, url: paper.url ?? "", savedAt: new Date().toISOString() }, ...current];
      toast.success("Paper saved!");
    }
    setSaved(updated);
    setSavedState(updated);
  }

  function sendToLM(paper: ResearchPaper) {
    const queue = JSON.parse(sessionStorage.getItem("aihumlm_queue") ?? "[]");
    queue.push({ id: paper.id, title: paper.title, url: paper.url, content: paper.abstract });
    sessionStorage.setItem("aihumlm_queue", JSON.stringify(queue));
    toast.success("Sent to AIHub LM — open that tab to analyze it!");
  }

  async function explainPaper(paper: ResearchPaper) {
    setExplaining(true);
    setExplanation(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          messages: [{
            role: "system",
            content: `You are a world-class AI research explainer. Break down research papers into clear, actionable insights for AI practitioners.
Format your response with these exact sections using markdown:
## 🆕 What's New
## ⚙️ How It Works
## 📊 Key Results
## 💡 Why It Matters
## 🎯 Who Should Read This
Keep each section to 2-4 sentences. Be specific, not vague.`,
          }, {
            role: "user",
            content: `Explain this research paper:\n\nTitle: ${paper.title}\n\nAbstract: ${paper.abstract}\n\n${paper.tldr ? `TL;DR: ${paper.tldr}` : ""}`,
          }],
        }),
      });
      const data = await res.json();
      setExplanation(data.content ?? "Could not generate explanation.");
    } catch {
      toast.error("Failed to generate explanation");
    } finally {
      setExplaining(false);
    }
  }

  const isSaved = (id: string) => saved.some(p => p.id === id);
  const displayPapers = showSaved
    ? papers.filter(p => saved.some(s => s.id === p.id))
    : papers;

  const avgCitations = papers.length
    ? Math.round(papers.reduce((s, p) => s + (p.citations ?? 0), 0) / papers.length)
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Research Center" description="Live AI research from arXiv & Semantic Scholar — search, understand, and apply" />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Main Content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Search + Controls */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 md:px-6 py-3 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search papers: LLMs, agents, RAG, alignment, diffusion..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 h-9 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="submit" disabled={loading} size="sm" className="gap-2 px-4">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Search
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => loadPapers(activeQuery)} disabled={loading} className="px-3">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </form>

            {/* Topics */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {TOPICS.map(t => (
                <button key={t.label} onClick={() => selectTopic(t)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${activeTopic === t.label ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
                  <span>{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            {/* AI Research Brief */}
            {(briefLoading || aiBrief) && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Research Brief</span>
                  {briefLoading && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin ml-1" />}
                  <span className="text-xs text-muted-foreground ml-auto">Topic: {activeQuery}</span>
                </div>
                {briefLoading && !aiBrief && (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-3 bg-primary/10 rounded animate-pulse" style={{ width: `${75 + i * 8}%` }} />)}
                  </div>
                )}
                {aiBrief && (
                  <div className="text-sm text-foreground/90 prose prose-sm dark:prose-invert max-w-none">
                    {aiBrief.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) return <p key={i} className="font-bold text-sm mt-2 mb-0.5 text-foreground">{line.slice(3)}</p>;
                      if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="text-xs text-foreground/80 ml-3 before:content-['•'] before:mr-1.5 before:text-primary">{line.slice(2)}</p>;
                      if (!line.trim()) return null;
                      return <p key={i} className="text-xs text-foreground/80">{line}</p>;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Stats + controls bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <FlaskConical className="h-3.5 w-3.5 text-primary" />
                  {loading ? "Loading..." : `${papers.length} papers`}
                </span>
                {!loading && papers.length > 0 && (
                  <>
                    <span className="flex items-center gap-1"><Quote className="h-3 w-3" />avg {avgCitations} citations</span>
                    <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{saved.length} saved</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setShowSaved(!showSaved)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${showSaved ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  <Bookmark className="h-3 w-3" />Saved ({saved.length})
                </button>
                <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                  {SORT_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setSortBy(s.value)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-all ${sortBy === s.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                      <s.icon className="h-3 w-3" />{s.label}
                    </button>
                  ))}
                </div>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}><List className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`rounded-xl bg-muted animate-pulse ${viewMode === "grid" ? "h-64" : "h-28"}`} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && displayPapers.length === 0 && (
              <div className="py-24 text-center">
                <FlaskConical className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-base font-medium mb-1">{showSaved ? "No saved papers" : "No papers found"}</p>
                <p className="text-sm text-muted-foreground">{showSaved ? "Save papers to read later" : "Try a different search query or topic"}</p>
              </div>
            )}

            {/* Papers */}
            {!loading && displayPapers.length > 0 && (
              <motion.div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {displayPapers.map(paper => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    viewMode={viewMode}
                    isSaved={isSaved(paper.id)}
                    isSelected={selected?.id === paper.id}
                    onSelect={() => { setSelected(paper); setExplanation(null); }}
                    onSave={() => toggleSave(paper)}
                    onSendToLM={() => sendToLM(paper)}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-[420px] border-l border-border flex flex-col flex-shrink-0 bg-background"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                <h3 className="text-sm font-semibold">Paper Details</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => sendToLM(selected)}>
                    <Send className="h-3 w-3" />AIHub LM
                  </Button>
                  <button onClick={() => { setSelected(null); setExplanation(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-5 space-y-5">
                  {/* Title + meta */}
                  <div>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1">
                        <h2 className="text-base font-bold leading-snug">{selected.title}</h2>
                      </div>
                      <button onClick={() => toggleSave(selected)} className={`flex-shrink-0 mt-0.5 transition-colors ${isSaved(selected.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                        {isSaved(selected.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {selected.authors.slice(0, 4).length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {selected.authors.slice(0, 3).map(a => a.split(" ").pop()).join(", ")}
                          {selected.authors.length > 3 && ` +${selected.authors.length - 3}`}
                        </span>
                      )}
                      {selected.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(selected.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                      {selected.source && (
                        <span className={`flex items-center gap-1 font-medium ${selected.isHot ? "text-orange-600 dark:text-orange-400" : ""}`}>
                          {selected.isHot ? "🔥 " : ""}{selected.source}
                        </span>
                      )}
                      {(selected.citations ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Quote className="h-3 w-3" />
                          {(selected.citations ?? 0).toLocaleString()} citations
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.categories ?? []).slice(0, 4).map(cat => (
                      <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                    ))}
                    {selected.arxivId && (
                      <a href={`https://arxiv.org/abs/${selected.arxivId}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" />arXiv
                      </a>
                    )}
                    {selected.url && (
                      <a href={selected.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <BookOpen className="h-3 w-3" />Read Paper
                      </a>
                    )}
                  </div>

                  {/* TL;DR */}
                  {selected.tldr && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" />TL;DR
                      </p>
                      <p className="text-sm leading-relaxed">{selected.tldr}</p>
                    </div>
                  )}

                  {/* Abstract */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Abstract</p>
                    <p className="text-sm leading-relaxed text-foreground/90">{selected.abstract}</p>
                  </div>

                  {/* AI Explain */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Explanation</p>
                      {!explanation && !explaining && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 ai-gradient border-0 text-white"
                          onClick={() => explainPaper(selected)}>
                          <Sparkles className="h-3 w-3" />Explain This
                        </Button>
                      )}
                    </div>

                    {explaining && (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analyzing paper with AI...</span>
                      </div>
                    )}

                    {explanation && (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="text-sm leading-relaxed space-y-3">
                          {explanation.split(/\n## /).map((section, i) => {
                            if (!section.trim()) return null;
                            const lines = section.split("\n");
                            const heading = i === 0 ? lines[0].replace(/^## /, "") : lines[0];
                            const body = lines.slice(1).join("\n").trim();
                            return (
                              <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border/50">
                                <p className="text-xs font-bold mb-1">{heading}</p>
                                <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
                              </div>
                            );
                          })}
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs mt-2 gap-1"
                          onClick={() => explainPaper(selected)}>
                          <RefreshCw className="h-3 w-3" />Regenerate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PaperCard({
  paper, viewMode, isSaved, isSelected, onSelect, onSave, onSendToLM,
}: {
  paper: ResearchPaper;
  viewMode: "grid" | "list";
  isSaved: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onSave: () => void;
  onSendToLM: () => void;
}) {
  const year = paper.publishedAt ? new Date(paper.publishedAt).getFullYear() : null;
  const pubDate = paper.publishedAt ? new Date(paper.publishedAt) : null;
  const daysAgo = pubDate ? Math.floor((Date.now() - pubDate.getTime()) / 86400000) : null;
  const isNew = daysAgo !== null && daysAgo <= 3;
  const source = paper.source ?? (paper.id.startsWith("hf") ? "HF Daily" : paper.id.startsWith("arxiv") ? "arXiv" : "S2");
  const accentColor = paper.id.startsWith("hf") ? "bg-orange-500" : paper.id.startsWith("arxiv") ? "bg-blue-500" : "bg-emerald-500";

  if (viewMode === "list") {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
        <div onClick={onSelect}
          className={`group rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${isSelected ? "border-primary/60 bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${paper.isHot ? "border-orange-400 text-orange-600" : ""}`}>
                  {paper.isHot ? "🔥 " : ""}{source}
                </Badge>
                {isNew && <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">NEW</span>}
                {year && <span className="text-xs text-muted-foreground">{year}</span>}
                {(paper.citations ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Quote className="h-3 w-3" />{(paper.citations ?? 0).toLocaleString()}
                  </span>
                )}
                {paper.tldr && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-normal">TL;DR</Badge>}
              </div>
              <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-1">{paper.title}</h3>
              {paper.tldr ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{paper.tldr}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{paper.abstract}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={onSave} className={`p-1.5 rounded-lg hover:bg-accent transition-colors ${isSaved ? "text-primary" : "text-muted-foreground"}`}>
                {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </button>
              <button onClick={onSendToLM} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <Send className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 280, damping: 22 } } }}>
      <div onClick={onSelect}
        className={`group h-64 rounded-xl border overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${isSelected ? "border-primary/60 shadow-md bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>

        {/* Top accent */}
        <div className={`h-1 w-full flex-shrink-0 ${accentColor}`} />

        <div className="flex-1 p-4 flex flex-col min-h-0">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${paper.isHot ? "border-orange-400 text-orange-600 dark:text-orange-400" : ""}`}>
                {paper.isHot ? "🔥 " : ""}{source}
              </Badge>
              {isNew && <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">NEW</span>}
              {year && <span className="text-[10px] text-muted-foreground">{year}</span>}
              {paper.tldr && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">TL;DR ✓</span>}
            </div>
            {(paper.citations ?? 0) > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Quote className="h-2.5 w-2.5" />{(paper.citations ?? 0).toLocaleString()}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {paper.title}
          </h3>

          {/* TL;DR or abstract */}
          {paper.tldr ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 mb-2 flex-shrink-0">
              <p className="text-xs leading-relaxed text-foreground line-clamp-2">{paper.tldr}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-2">
              {paper.abstract}
            </p>
          )}

          {/* Authors */}
          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-auto">
            {paper.authors.slice(0, 3).map(a => a.split(" ").pop()).join(", ")}
            {paper.authors.length > 3 && ` et al.`}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/20 flex-shrink-0"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button onClick={onSave}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all hover:bg-accent ${isSaved ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {isSaved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
              {isSaved ? "Saved" : "Save"}
            </button>
            <button onClick={onSendToLM}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all hover:bg-accent text-muted-foreground hover:text-foreground">
              <Send className="h-3 w-3" />LM
            </button>
          </div>
          {paper.url && (
            <a href={paper.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent">
              <ExternalLink className="h-3 w-3" />Read
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
