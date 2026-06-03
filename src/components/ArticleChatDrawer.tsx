"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { NewsArticle } from "@/types";
import {
  X, Send, Sparkles, ExternalLink, Loader2, Bot,
  MessageSquare, RotateCcw,
} from "lucide-react";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "What are the key takeaways?",
  "What are the implications for AI?",
  "Explain the technical concepts",
  "How does this compare to recent trends?",
];

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-sm mt-2 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith("## "))  return <h2 key={i} className="font-bold text-sm mt-2 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return <li key={i} className="ml-3 list-disc text-sm">{formatInline(line.slice(2))}</li>;
      }
      if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
        return <p key={i} className="font-semibold text-sm">{line.slice(2, -2)}</p>;
      }
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>;
    });
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-muted px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

export function ArticleChatDrawer({
  article,
  onClose,
}: {
  article: NewsArticle;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `I've read **"${article.title}"** from ${article.source}. Ask me anything about it — key points, implications, technical concepts, or how it connects to the broader AI landscape.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const systemPrompt = `You are an expert AI analyst helping the user understand this specific article. Stay focused on the article content and its context.

ARTICLE DETAILS:
Title: ${article.title}
Source: ${article.source}
Category: ${article.category}
Published: ${new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
URL: ${article.url}

FULL CONTENT:
${article.summary}

TAGS: ${article.tags.join(", ")}

YOUR ROLE:
- Answer questions specifically about this article
- Provide deeper context, analysis, and implications
- Explain technical concepts mentioned in the article
- Connect the article to broader AI trends
- Be concise, insightful, and conversational
- Use markdown: **bold**, bullet points, and code blocks when helpful
- If asked something unrelated to the article, gently redirect back`;

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openrouter",
          model: "openai/gpt-oss-120b:free",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: text },
          ],
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.content ?? "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Failed to connect to AI. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function reset() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `I've read **"${article.title}"** from ${article.source}. Ask me anything about it — key points, implications, technical concepts, or how it connects to the broader AI landscape.`,
      },
    ]);
    setInput("");
  }

  return (
    /* backdrop */
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 border-b border-border flex-shrink-0 bg-muted/30">
          <div className="h-9 w-9 rounded-xl ai-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <MessageSquare className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Article Chat</span>
            </div>
            <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">
              {article.title}
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
            >
              {article.source} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={reset}
              title="Clear conversation"
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="h-6 w-6 rounded-md ai-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                {renderMarkdown(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="h-6 w-6 rounded-md ai-gradient flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1 items-center">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick prompts (only before first user message) ─ */}
        {messages.filter((m) => m.role === "user").length === 0 && (
          <div className="px-4 pb-2 flex flex-col gap-1.5 flex-shrink-0">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Quick questions</p>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={loading}
                className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Input bar ──────────────────────────────────── */}
        <div className="border-t border-border p-3 bg-background/95 flex-shrink-0">
          <div className="flex gap-2 items-end bg-background border-2 border-border rounded-xl px-3 py-2 focus-within:border-primary transition-colors shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about this article…"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-sm resize-none outline-none max-h-28 leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="h-8 w-8 rounded-lg ai-gradient flex items-center justify-center disabled:opacity-40 flex-shrink-0 transition-opacity"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                : <Send className="h-3.5 w-3.5 text-white" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Powered by AIHub AI · Focused on this article
          </p>
        </div>
      </motion.div>
    </div>
  );
}
