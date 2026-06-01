"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, MessageSquare, Sparkles, Send,
  BookOpen, Lightbulb, Quote, Copy,
  Check, X, Globe, AlertCircle, Brain, Loader2,
  Newspaper, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface Source {
  id: string;
  type: "text" | "url" | "paste";
  title: string;
  content: string;
  summary?: string;
  keyPoints?: string[];
  wordCount: number;
  addedAt: Date;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  timestamp: Date;
}

const STARTER_QUESTIONS = [
  "What are the main themes across all my sources?",
  "Summarize the key insights in 5 bullet points",
  "What are the most important concepts I should know?",
  "Generate a study guide from these sources",
  "What questions should I ask to understand this better?",
  "Compare and contrast the different perspectives",
];

export default function AIHubLMPage() {
  const [sources, setSources]       = useState<Source[]>([]);
  const [messages, setMessages]     = useState<ChatMsg[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [activeTab, setActiveTab]   = useState<"chat" | "notes">("chat");
  const [urlInput, setUrlInput]     = useState("");
  const [pasteText, setPasteText]   = useState("");
  const [addMode, setAddMode]       = useState<"none" | "url" | "paste">("none");
  const [processingSource, setProcessingSource] = useState(false);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Load from sessionStorage queue on mount ────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const queue = sessionStorage.getItem("aihumlm_queue");
      if (queue) {
        const items = JSON.parse(queue);
        if (Array.isArray(items) && items.length > 0) {
          const newSources: Source[] = items.map((item: any) => ({
            id: `src-${item.id || Date.now()}`,
            type: "url",
            title: item.title || new URL(item.url).hostname.replace("www.", ""),
            content: item.url,
            summary: item.content || `Article from ${item.title}`,
            keyPoints: [],
            wordCount: 0,
            addedAt: new Date(),
          }));
          setSources(prev => {
            const ids = new Set(prev.map(s => s.id));
            return [...prev, ...newSources.filter(s => !ids.has(s.id))];
          });
          sessionStorage.removeItem("aihumlm_queue");
          toast.success(`${newSources.length} article(s) loaded for analysis`);
        }
      }
    } catch (error) {
      console.error("Failed to load from queue:", error);
    }
  }, []);

  // ── Add URL source ─────────────────────────────────────────────────────
  async function addUrlSource() {
    if (!urlInput.trim()) return;
    setProcessingSource(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek/deepseek-v3-base:free",
          messages: [
            {
              role: "system",
              content: "You are an AI research assistant. The user will give you a URL. Acknowledge it and provide a brief description of what kind of content it likely contains based on the URL structure. Be concise.",
            },
            { role: "user", content: `URL to process: ${urlInput}` },
          ],
        }),
      });
      const data = await res.json();
      const source: Source = {
        id: `src-${Date.now()}`,
        type: "url",
        title: new URL(urlInput).hostname.replace("www.", ""),
        content: urlInput,
        summary: data.content,
        keyPoints: [],
        wordCount: 0,
        addedAt: new Date(),
      };
      setSources(prev => [...prev, source]);
      setUrlInput("");
      setAddMode("none");
      toast.success("Source added");
    } catch {
      toast.error("Failed to add URL");
    } finally {
      setProcessingSource(false);
    }
  }

  // ── Add pasted text source ─────────────────────────────────────────────
  async function addPasteSource() {
    if (!pasteText.trim()) return;
    setProcessingSource(true);
    try {
      const words = pasteText.trim().split(/\s+/).length;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek/deepseek-v3-base:free",
          messages: [
            {
              role: "system",
              content: `You are an expert document analyzer. Analyze text and extract key information.

Your task: Given a document, provide:
1. A concise title (max 8 words) that captures the main topic
2. A 2-sentence summary of the key points
3. 4-5 bullet points of the most important insights

Return ONLY valid JSON (no markdown, no extra text):
{"title":"...","summary":"...","keyPoints":["point1","point2",...]}

Make the summary and key points specific and actionable.`,
            },
            { role: "user", content: `Analyze this document:\n\n${pasteText.slice(0, 3000)}` },
          ],
        }),
      });
      const data = await res.json();
      let parsed: { title?: string; summary?: string; keyPoints?: string[] } = {};
      try {
        const jsonMatch = (data.content ?? "").match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch { /**/ }

      const source: Source = {
        id: `src-${Date.now()}`,
        type: "paste",
        title: parsed.title ?? `Document ${sources.length + 1}`,
        content: pasteText,
        summary: parsed.summary,
        keyPoints: parsed.keyPoints ?? [],
        wordCount: words,
        addedAt: new Date(),
      };
      setSources(prev => [...prev, source]);
      setPasteText("");
      setAddMode("none");
      toast.success("Document analyzed and added");
    } catch {
      toast.error("Failed to process document");
    } finally {
      setProcessingSource(false);
    }
  }

  // ── Chat with sources ─────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || loading) return;
    if (sources.length === 0) {
      toast.error("Add at least one source first");
      return;
    }

    const userMsg: ChatMsg = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const sourceContext = sources.map((s, i) =>
        `[Source ${i+1}: ${s.title}]\n${s.type === "url" ? s.content : s.content.slice(0, 2000)}`
      ).join("\n\n---\n\n");

      const history = messages.slice(-6).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek/deepseek-v3-base:free",
          messages: [
            {
              role: "system",
              content: `You are AIHub LM, an intelligent research and learning assistant powered by deep document analysis. You're like Google NotebookLM enhanced with AI superpowers.

Your sources are:
${sourceContext}

**Your Mission:**
Help users deeply understand their documents through insightful analysis, synthesis, and explanation.

**Core Rules:**
✅ ALWAYS ground answers in the provided sources
✅ Cite sources as [Source 1], [Source 2], etc. when referencing them
✅ Be thorough, rigorous, and genuinely insightful
✅ Synthesize across multiple sources to find connections
✅ If something isn't in the sources, say so clearly
✅ Use markdown for clarity: bold, bullets, code blocks, headers

**What You Excel At:**
📚 Summarize documents clearly and concisely
🔍 Answer detailed questions grounded in sources
🧠 Extract and explain key concepts
📊 Compare and contrast ideas across sources
📖 Create study guides with structure and depth
❓ Generate thought-provoking discussion questions
🔗 Identify connections between different sources
💡 Explain complex topics in accessible language

**Response Quality Standards:**
- Provide detailed, well-structured answers
- Use specific examples from the sources
- Add genuine insight beyond just repeating text
- Make complex ideas understandable
- Be specific and avoid vague generalizations`,
            },
            ...history,
            { role: "user", content: userMsg.content },
          ],
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMsg = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.content ?? "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      toast.error("Failed to get response");
    } finally {
      setLoading(false);
    }
  }

  // ── Generate notebook overview ────────────────────────────────────────
  async function generateOverview() {
    if (sources.length === 0) { toast.error("Add sources first"); return; }
    setInput("Generate a comprehensive overview of all my sources. Include: main themes, key insights, important concepts, and what I should focus on learning.");
  }

  async function copyMsg(id: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const selectedSource = sources.find(s => s.id === selectedSourceId);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="AIHub LM" description="NotebookLM-powered AI research workspace" />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Sources Panel ──────────────────────────────────────── */}
        <div className="w-72 border-r border-border flex flex-col bg-sidebar flex-shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Sources</p>
                <p className="text-xs text-muted-foreground">{sources.length} added</p>
              </div>
            </div>

            {/* Add Source Buttons */}
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddMode(addMode === "url" ? "none" : "url")}
                className="w-full justify-start gap-2 text-xs"
              >
                <Globe className="h-3.5 w-3.5" />
                Add URL / Website
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddMode(addMode === "paste" ? "none" : "paste")}
                className="w-full justify-start gap-2 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Paste Text / Article
              </Button>
              <Button
                size="sm"
                className="w-full justify-start gap-2 text-xs ai-gradient border-0"
                onClick={generateOverview}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Overview
              </Button>
            </div>
          </div>

          {/* Add URL Form */}
          <AnimatePresence>
            {addMode === "url" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border"
              >
                <div className="p-3 space-y-2">
                  <input
                    placeholder="https://example.com/article..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addUrlSource()}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addUrlSource} loading={processingSource} className="flex-1 text-xs">
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddMode("none")} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {addMode === "paste" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border"
              >
                <div className="p-3 space-y-2">
                  <textarea
                    placeholder="Paste your article, notes, research, or any text here..."
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addPasteSource} loading={processingSource} className="flex-1 text-xs">
                      {processingSource ? "Analyzing…" : "Analyze & Add"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddMode("none")} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Source List */}
          <ScrollArea className="flex-1 p-3">
            {sources.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">No sources yet</p>
                <p className="text-xs text-muted-foreground">Add URLs or paste text to get started</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {sources.map(source => (
                  <div
                    key={source.id}
                    className={`group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                      selectedSourceId === source.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-accent border border-transparent"
                    }`}
                    onClick={() => setSelectedSourceId(selectedSourceId === source.id ? null : source.id)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {source.type === "url" ? (
                        <Globe className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-violet-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{source.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {source.type === "url" ? "URL" : `${source.wordCount} words`}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSources(prev => prev.filter(s => s.id !== source.id));
                        if (selectedSourceId === source.id) setSelectedSourceId(null);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Source detail */}
          <AnimatePresence>
            {selectedSource && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border overflow-hidden"
              >
                <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
                  <p className="text-xs font-semibold">{selectedSource.title}</p>
                  {selectedSource.summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedSource.summary}</p>
                  )}
                  {(selectedSource.keyPoints ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Key Points</p>
                      {selectedSource.keyPoints!.map((kp, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1">
                          <span className="text-primary font-bold text-xs flex-shrink-0">•</span>
                          <p className="text-xs text-muted-foreground">{kp}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Main: Chat Area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Bar */}
          <div className="flex border-b border-border px-4 bg-background/80 backdrop-blur flex-shrink-0">
            {(["chat", "notes"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "chat" ? <MessageSquare className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
                {tab === "chat" ? "Chat" : "Insights"}
              </button>
            ))}
          </div>

          {activeTab === "chat" && (
            <>
              <ScrollArea className="flex-1 p-6" ref={scrollRef as never}>
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Welcome */}
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto mb-4">
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-xl font-bold mb-2">AIHub LM</h2>
                      <p className="text-muted-foreground text-sm mb-6">
                        Your AI-powered research workspace. Add sources, then ask anything.
                      </p>
                      {sources.length === 0 ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          Add sources from the left panel to get started
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-left max-w-md mx-auto">
                          {STARTER_QUESTIONS.slice(0, 4).map(q => (
                            <button
                              key={q}
                              onClick={() => setInput(q)}
                              className="text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-accent text-xs transition-all"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <Brain className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className={`group max-w-[80%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-muted-foreground">
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button
                              onClick={() => copyMsg(msg.id, msg.content)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedId === msg.id
                                ? <Check className="h-3 w-3 text-green-500" />
                                : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:"0ms"}}/>
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:"150ms"}}/>
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:"300ms"}}/>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Starter Qs */}
              {messages.length > 0 && sources.length > 0 && (
                <div className="px-6 pb-2 flex gap-2 overflow-x-auto">
                  {STARTER_QUESTIONS.slice(0, 3).map(q => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-accent transition-all whitespace-nowrap"
                    >
                      {q.slice(0, 40)}…
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="max-w-2xl mx-auto">
                  <div className="flex gap-3 items-end bg-background border border-border rounded-xl p-3 focus-within:ring-2 focus-within:ring-ring transition-all">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                      placeholder={sources.length === 0 ? "Add sources first…" : "Ask anything about your sources…"}
                      rows={1}
                      disabled={loading || sources.length === 0}
                      className="flex-1 bg-transparent text-sm resize-none outline-none max-h-32 disabled:opacity-40 leading-relaxed"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || loading || sources.length === 0}
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 border-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Enter to send · Grounded in your {sources.length} source{sources.length !== 1 ? "s" : ""} · Powered by DeepSeek V3
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "notes" && (
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold">Source Insights</h2>
                  <Badge variant="secondary" className="text-xs">{sources.length} sources</Badge>
                </div>

                {sources.length === 0 ? (
                  <div className="py-16 text-center">
                    <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Add sources to see insights</p>
                  </div>
                ) : (
                  sources.map((source, i) => (
                    <Card key={source.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {source.type === "url"
                              ? <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              : <FileText className="h-4 w-4 text-violet-500 flex-shrink-0" />}
                            <CardTitle className="text-sm">{source.title}</CardTitle>
                          </div>
                          <Badge variant="secondary" className="text-xs">Source {i + 1}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {source.summary && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <Quote className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{source.summary}</p>
                          </div>
                        )}
                        {(source.keyPoints ?? []).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Points</p>
                            <div className="space-y-1.5">
                              {source.keyPoints!.map((kp, j) => (
                                <div key={j} className="flex items-start gap-2">
                                  <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm">{kp}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {source.type === "url" && (
                          <a href={source.content} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Open source →
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
