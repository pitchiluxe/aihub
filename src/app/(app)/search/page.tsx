"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsArticle } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Search, Sparkles, Newspaper, ExternalLink,
  Loader2, Send, Bot, RefreshCw, Cpu, Wifi, WifiOff,
  ChevronDown, ChevronRight, Copy, Check,
} from "lucide-react";

interface AgentMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: NewsArticle[];
  model?: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "What's the latest news about GPT-5?",
  "Compare DeepSeek V3 vs Claude 3.5 Sonnet",
  "Explain how AI agents work",
  "What are the best free AI models right now?",
  "How do I build a RAG system?",
  "What happened in AI this week?",
  "Which AI model is best for coding?",
  "Explain the Model Context Protocol (MCP)",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages]         = useState<AgentMsg[]>([]);
  const [input, setInput]               = useState(searchParams.get("q") ?? "");
  const [loading, setLoading]           = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "online" | "offline">("checking");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("ollama-auto");
  const [showSources, setShowSources]   = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [latestNews, setLatestNews]     = useState<NewsArticle[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Check Ollama status via server-side proxy (avoids CORS / production issues)
  useEffect(() => {
    async function checkOllama() {
      try {
        const res = await fetch("/api/ollama/status", { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data.running) {
            setOllamaModels(data.models ?? []);
            setOllamaStatus("online");
            if (data.models?.length > 0) setSelectedModel(`ollama:${data.models[0]}`);
          } else {
            setOllamaStatus("offline");
          }
        } else {
          setOllamaStatus("offline");
        }
      } catch {
        setOllamaStatus("offline");
      }
    }
    checkOllama();
  }, []);

  // Load latest news for context
  useEffect(() => {
    fetch("/api/news?limit=20", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setLatestNews(d.articles ?? []));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-send initial query if present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && messages.length === 0) {
      setTimeout(() => sendMessage(q), 300);
    }
  }, []);

  async function sendMessage(query?: string) {
    const text = (query ?? input).trim();
    if (!text || loading) return;

    const userMsg: AgentMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Find relevant news articles for context
      const q = text.toLowerCase();
      const relevantNews = latestNews
        .filter(a =>
          a.title.toLowerCase().includes(q.split(" ")[0]) ||
          a.summary.toLowerCase().includes(q.split(" ")[0]) ||
          q.split(" ").some(word => word.length > 3 && (a.title.toLowerCase().includes(word) || a.tags.some(t => t.toLowerCase().includes(word))))
        )
        .slice(0, 5);

      const newsContext = relevantNews.length > 0
        ? `\n\nRecent AI News Context (use these as sources):\n${relevantNews.map((a, i) =>
            `[${i+1}] "${a.title}" — ${a.source} (${formatDate(a.publishedAt)})\nSummary: ${a.summary}`
          ).join("\n\n")}`
        : "";

      const systemPrompt = `You are Aria, AIHub's expert AI intelligence agent. You're knowledgeable, engaging, and always provide detailed, accurate responses about artificial intelligence.

Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.${newsContext}

**Your expertise:**
- 🤖 AI models (capabilities, pricing, use cases)
- 📰 AI industry news and announcements
- 🔬 AI research and breakthroughs
- 💼 AI companies and products
- 🛠️ AI tools and frameworks
- 💡 AI concepts (agents, RAG, MCP, etc.)
- 💻 How to build AI applications

**Response style:**
- Be conversational and enthusiastic about AI
- Provide specific examples and links when possible
- Use markdown formatting: bold, bullets, code blocks
- When citing news, use [1], [2], etc.
- Always cite your sources from the provided context
- If you're uncertain about something recent, say so clearly
- Be thorough but well-organized
- Make complex topics understandable

**Important:** Provide genuinely helpful, detailed responses that show deep knowledge.`;

      const history = messages.slice(-8).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Determine provider and model
      let provider = "openrouter";
      let model = "meta-llama/llama-3.2-3b-instruct:free";

      if (selectedModel.startsWith("ollama:") && ollamaStatus === "online") {
        provider = "ollama";
        model = selectedModel.replace("ollama:", "");
      } else if (selectedModel !== "ollama-auto" && !selectedModel.startsWith("ollama:")) {
        model = selectedModel;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: text },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error ?? "Request failed";
        // Parse API error for better UX
        let userFriendlyError = errorMsg;
        if (errorMsg.includes("All models failed") || errorMsg.includes("rate-limited")) {
          userFriendlyError = "🔄 **AI Models Currently Unavailable**\n\nOpenRouter is rate-limited and Ollama is not running.\n\n**Try one of these:**\n1. Wait 1-2 minutes and retry\n2. [Install Ollama](https://ollama.ai/download) for offline AI\n3. [Verify your API key](.env.local)";
        } else if (errorMsg.includes("Ollama")) {
          userFriendlyError = "🖥️ **Ollama Not Running**\n\nStart Ollama to use local AI:\n\n\`ollama serve\`\n\nOr [install it first](https://ollama.ai/download)";
        } else if (errorMsg.includes("API key")) {
          userFriendlyError = "🔑 **API Key Missing**\n\nAdd `OPENROUTER_API_KEY` to `.env.local` or install Ollama for offline mode.";
        }
        throw new Error(userFriendlyError);
      }

      const assistantMsg: AgentMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.content ?? "I couldn't generate a response.",
        sources: relevantNews,
        model: data.model,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: AgentMsg = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `${err instanceof Error ? err.message : "Failed to connect to AI. Make sure Ollama is running or OpenRouter is configured."}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function copyMsg(id: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const isOllamaAvailable = ollamaStatus === "online" && ollamaModels.length > 0;

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="AIHub Google" description="AI-powered intelligence agent for everything AI" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Model Selector + Status Bar */}
        <div className="flex items-center gap-3 px-6 py-2 border-b border-border bg-background/80 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-2">
            {ollamaStatus === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {ollamaStatus === "online"  && <div className="flex items-center gap-1.5 text-xs text-green-500"><Wifi className="h-3.5 w-3.5"/><span>Ollama online</span></div>}
            {ollamaStatus === "offline" && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><WifiOff className="h-3.5 w-3.5"/><span>Ollama offline</span></div>}
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {/* OpenRouter option */}
            <button
              onClick={() => setSelectedModel("meta-llama/llama-3.2-3b-instruct:free")}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                !selectedModel.startsWith("ollama") ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Cpu className="h-3 w-3" />
              OpenRouter (Free)
            </button>

            {/* Ollama models */}
            {ollamaModels.map(m => (
              <button
                key={m}
                onClick={() => setSelectedModel(`ollama:${m}`)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                  selectedModel === `ollama:${m}` ? "bg-green-500 text-white border-green-500" : "border-border text-muted-foreground hover:border-green-400"
                }`}
              >
                <Bot className="h-3 w-3" />
                {m}
              </button>
            ))}

            {ollamaStatus === "offline" && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                Start Ollama: <code className="bg-muted px-1 rounded">ollama serve</code>
              </span>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Hero / Landing */
            <div className="max-w-2xl mx-auto px-6 py-12">
              <div className="text-center mb-10">
                <div className="h-20 w-20 rounded-3xl ai-gradient flex items-center justify-center mx-auto mb-5">
                  <Search className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  <span className="ai-gradient-text">AIHub</span> Intelligence Agent
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Powered by {isOllamaAvailable ? `Ollama (${ollamaModels[0]})` : "OpenRouter free models"}.
                  Ask anything about AI — news, models, research, code.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); sendMessage(s); }}
                    className="text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-accent text-sm transition-all group"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary mb-1.5 group-hover:scale-110 transition-transform" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-4 space-y-5">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg ai-gradient flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`group flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}>
                      <MarkdownText content={msg.content} />
                    </div>

                    {/* Sources */}
                    {msg.role === "assistant" && (msg.sources ?? []).length > 0 && (
                      <div className="w-full">
                        <button
                          onClick={() => setShowSources(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Newspaper className="h-3 w-3" />
                          {msg.sources!.length} news sources
                          {showSources[msg.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                        <AnimatePresence>
                          {showSources[msg.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-2 space-y-1.5"
                            >
                              {msg.sources!.map((src, i) => (
                                <a
                                  key={src.id}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start gap-2 p-2 rounded-lg bg-background border border-border hover:border-primary/40 transition-colors text-xs group"
                                >
                                  <span className="text-primary font-bold flex-shrink-0">[{i+1}]</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate group-hover:text-primary transition-colors">{src.title}</p>
                                    <p className="text-muted-foreground">{src.source} · {formatDate(src.publishedAt)}</p>
                                  </div>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                </a>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.model && <Badge variant="outline" className="text-[10px] px-1 py-0">{msg.model.split("/").pop()}</Badge>}
                      <button onClick={() => copyMsg(msg.id, msg.content)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {copiedId === msg.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-lg ai-gradient flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:"0ms"}}/>
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:"150ms"}}/>
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:"300ms"}}/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-border p-4 bg-background/95 backdrop-blur flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Suggestion chips (after first message) */}
            {messages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                {SUGGESTIONS.slice(0, 4).map(s => (
                  <button key={s} onClick={() => { setInput(s); sendMessage(s); }}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-accent transition-all whitespace-nowrap">
                    {s.slice(0, 35)}…
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-end bg-background border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary transition-colors shadow-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask anything about AI — news, models, research, code..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-sm resize-none outline-none max-h-32 leading-relaxed disabled:opacity-50"
              />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="icon" className="h-9 w-9 flex-shrink-0 ai-gradient border-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {isOllamaAvailable
                ? `🟢 Running on ${ollamaModels[0]} via Ollama (local)`
                : "Running on OpenRouter free models · Start Ollama for local AI"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple markdown renderer
function MarkdownText({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-sm mt-2">{line.slice(4)}</h3>;
        if (line.startsWith("## "))  return <h2 key={i} className="font-bold text-sm mt-2">{line.slice(3)}</h2>;
        if (line.startsWith("# "))   return <h1 key={i} className="font-bold text-base mt-2">{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <div key={i} className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">•</span><span>{renderInline(line.slice(2))}</span></div>;
        }
        if (/^\d+\./.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return <div key={i} className="flex items-start gap-1.5"><span className="text-primary font-bold flex-shrink-0 w-5">{num}.</span><span>{renderInline(line.replace(/^\d+\.\s*/, ""))}</span></div>;
        }
        if (line.startsWith("```")) return null;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2,-2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-background/50 rounded px-1 font-mono text-xs">{part.slice(1,-1)}</code>;
    return part;
  });
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
