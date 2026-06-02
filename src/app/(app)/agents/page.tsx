"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AI_AGENTS } from "@/lib/agents";
import { AgentProfile, AgentMessage } from "@/types";
import { useStore } from "@/store";
import {
  Send, Bot, Sparkles, ChevronLeft, Trash2, Copy, Check,
  Zap, Brain, Pen, Code, Microscope, Newspaper, RotateCcw, X,
} from "lucide-react";
import toast from "react-hot-toast";

const ICON_MAP: Record<string, React.ElementType> = {
  Newspaper, Brain, Pen, Bot, Zap, Microscope, Code,
};

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<AgentMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showOllamaHelp, setShowOllamaHelp] = useState(false);
  const [ollamaHelpMessage, setOllamaHelpMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { createConversation, addMessage } = useStore();

  function startConversation(agent: AgentProfile) {
    setSelectedAgent(agent);
    const cid = createConversation(agent.id);
    setConversationId(cid);
    setLocalMessages([]);
  }

  function clearConversation() {
    if (!selectedAgent) return;
    const cid = createConversation(selectedAgent.id);
    setConversationId(cid);
    setLocalMessages([]);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [localMessages]);

  async function sendMessage() {
    if (!input.trim() || !selectedAgent || loading) return;

    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      agentId: selectedAgent.id,
    };

    setLocalMessages((prev) => [...prev, userMsg]);
    if (conversationId) addMessage(conversationId, userMsg);
    setInput("");
    setLoading(true);

    try {
      const messages = [
        { role: "system" as const, content: selectedAgent.systemPrompt },
        ...localMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: userMsg.content },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedAgent.model,
          messages,
          provider: "openrouter",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        const errorMsg = errData.error || "Failed to get response";
        const suggestion = errData.suggestion || "";
        throw new Error(`${errorMsg}${suggestion ? ` - ${suggestion}` : ""}`);
      }
      const data = await res.json();

      const assistantMsg: AgentMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.content ?? "I apologize, I couldn't generate a response.",
        timestamp: new Date(),
        agentId: selectedAgent.id,
      };

      setLocalMessages((prev) => [...prev, assistantMsg]);
      if (conversationId) addMessage(conversationId, assistantMsg);
    } catch (err) {
      const errorText = String(err);
      
      // Check if this is an Ollama-related error
      if (
        errorText.includes("Ollama") ||
        errorText.includes("ollama") ||
        errorText.includes("serve") ||
        errorText.includes("connection refused") ||
        errorText.includes("not reachable")
      ) {
        setOllamaHelpMessage(errorText);
        setShowOllamaHelp(true);
        toast.error("Ollama not available — showing setup help");
      } else if (errorText.includes("API key")) {
        toast.error("OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env.local");
      } else if (errorText.includes("rate-limited") || errorText.includes("502")) {
        toast.error("API temporarily unavailable. Try again in a minute.");
      } else {
        toast.error(errorText.slice(0, 120) || "Failed to get response. Please try again.");
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function copyMessage(id: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (selectedAgent) {
    const AgentIcon = ICON_MAP[selectedAgent.icon] ?? Bot;
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar title={selectedAgent.name} description={selectedAgent.role} />
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
          {/* Sidebar */}
          <div className="w-72 border-r border-border flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-border">
              <button
                onClick={() => setSelectedAgent(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                All Agents
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: selectedAgent.color + "20", color: selectedAgent.color }}
                >
                  {selectedAgent.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedAgent.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedAgent.role}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{selectedAgent.description}</p>
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Capabilities</p>
                <div className="space-y-1">
                  {selectedAgent.capabilities.map((cap) => (
                    <div key={cap} className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 flex-shrink-0" style={{ color: selectedAgent.color }} />
                      <span className="text-xs">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearConversation}
                  className="w-full gap-2 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Chat
                </Button>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="p-4 border-t border-border">
              <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Quick Start</p>
              <div className="space-y-1">
                {getQuickPrompts(selectedAgent.id).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left text-xs p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <ScrollArea className="flex-1 p-6" ref={scrollRef as never}>
              <div className="max-w-3xl mx-auto space-y-4">
                {localMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                      style={{ backgroundColor: selectedAgent.color + "15" }}
                    >
                      {selectedAgent.avatar}
                    </div>
                    <h2 className="text-lg font-semibold">Chat with {selectedAgent.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {selectedAgent.description}
                    </p>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {localMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-1"
                          style={{ backgroundColor: selectedAgent.color + "20" }}
                        >
                          {selectedAgent.avatar}
                        </div>
                      )}
                      <div className={`group max-w-[80%] relative ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
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
                            onClick={() => copyMessage(msg.id, msg.content)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: selectedAgent.color + "20" }}
                    >
                      {selectedAgent.avatar}
                    </div>
                    <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-3 items-end bg-background border border-border rounded-xl p-3 focus-within:ring-2 focus-within:ring-ring">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedAgent.name}…`}
                    rows={1}
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm resize-none outline-none max-h-32 disabled:opacity-50 leading-relaxed"
                    style={{ minHeight: "24px" }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    style={{ backgroundColor: selectedAgent.color }}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Enter to send · Shift+Enter for new line · Specialized in AI topics only
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ollama Help Modal */}
        {showOllamaHelp && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Ollama Setup
                  </h3>
                  <button onClick={() => setShowOllamaHelp(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs font-semibold text-destructive mb-1">⚠ Error</p>
                  <p className="text-xs text-destructive/90 line-clamp-3">{ollamaHelpMessage}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold mb-2">1. Download Ollama</p>
                    <a href="https://ollama.ai/download" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full">
                        📥 Visit ollama.ai/download
                      </Button>
                    </a>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">2. Start Server</p>
                    <code className="block bg-muted rounded px-3 py-2 text-xs font-mono">ollama serve</code>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">3. Pull a Model</p>
                    <code className="block bg-muted rounded px-3 py-2 text-xs font-mono">ollama pull llama2</code>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" onClick={() => setShowOllamaHelp(false)} className="flex-1">
                    Close
                  </Button>
                  <Button onClick={() => window.open("https://ollama.ai/download", "_blank")} className="flex-1">
                    Install
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="AI Agents Hub" description="AI specialist agents for every task" />
      <div className="flex-1 p-3 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex h-16 w-16 rounded-2xl ai-gradient items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">AI Agent Specialists</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Each agent is a deep AI specialist. They only discuss AI-related topics and provide expert guidance.
          </p>
        </div>

        {/* Agent Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl mx-auto"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {AI_AGENTS.map((agent) => {
            const AgentIcon = ICON_MAP[agent.icon] ?? Bot;
            return (
              <motion.div
                key={agent.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
                }}
              >
                <Card
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  onClick={() => startConversation(agent)}
                >
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: agent.color }}
                  />
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: agent.color + "18" }}
                      >
                        {agent.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-base">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {agent.description}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {agent.capabilities.slice(0, 3).map((cap) => (
                        <span
                          key={cap}
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{ borderColor: agent.color + "40", color: agent.color }}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                    <Button
                      className="w-full gap-2 text-sm transition-all"
                      style={{ backgroundColor: agent.color }}
                      onClick={() => startConversation(agent)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Chat with {agent.name}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

function getQuickPrompts(agentId: string): string[] {
  const prompts: Record<string, string[]> = {
    // Core Agents
    "news-analyst": [
      "What are the biggest AI news stories this week?",
      "Compare OpenAI and Anthropic's recent announcements",
      "What AI startups should I watch in 2025?",
    ],
    "model-expert": [
      "Which free model is best for coding tasks?",
      "Compare Claude 3.5 vs GPT-4o for creative writing",
      "What's the best model for long document analysis?",
    ],
    "prompt-engineer": [
      "Help me write a system prompt for a customer service agent",
      "How do I get structured JSON output from an LLM?",
      "Show me a chain-of-thought prompt for math problems",
    ],
    "agent-builder": [
      "How do I build a RAG pipeline with LangChain?",
      "Design a multi-agent system for research tasks",
      "What's the best way to implement agent memory?",
    ],
    "workflow-architect": [
      "Design an AI workflow for document processing",
      "How do I automate email responses with AI?",
      "Build a n8n workflow for AI content generation",
    ],
    "research-assistant": [
      "Summarize the latest transformer architecture research",
      "What are the key findings from the GPT-4 paper?",
      "Explain retrieval augmented generation simply",
    ],
    "coding-mentor": [
      "Show me how to use the OpenAI API in TypeScript",
      "Build a simple RAG system with Python",
      "How do I stream responses from Claude API?",
    ],
    // Advanced AI Specialists
    "rag-specialist": [
      "How do I build a production RAG system?",
      "What are the best practices for chunking documents?",
      "How do I evaluate RAG system quality?",
    ],
    "fine-tuning-expert": [
      "When should I fine-tune vs prompt engineering?",
      "What's the optimal dataset size for fine-tuning?",
      "How do I reduce fine-tuning costs?",
    ],
    "mlops-engineer": [
      "Set up a CI/CD pipeline for ML models",
      "How do I monitor model performance in production?",
      "What's the best way to version ML datasets?",
    ],
    "eval-specialist": [
      "How do I evaluate LLM outputs systematically?",
      "What metrics matter most for my use case?",
      "How do I create a benchmark dataset?",
    ],
    "vision-expert": [
      "How do I detect objects in images with YOLO?",
      "What's the best model for image segmentation?",
      "How do I build a visual search system?",
    ],
    "audio-expert": [
      "How do I build a speech recognition system?",
      "What's the best model for audio classification?",
      "How do I do speech-to-text with accuracy?",
    ],
    "function-calling-expert": [
      "How do I use function calling with Claude?",
      "Build a calculator agent using function calling",
      "How do I chain multiple functions together?",
    ],
    "streaming-expert": [
      "How do I implement streaming responses?",
      "What's the best way to handle streaming errors?",
      "How do I stream tokens efficiently?",
    ],
    "cost-optimizer": [
      "How do I reduce my API costs by 50%?",
      "Which model gives the best quality per dollar?",
      "How do I estimate costs for my project?",
    ],
    "security-officer": [
      "How do I prevent prompt injection attacks?",
      "What are the security risks of LLMs?",
      "How do I audit AI system security?",
    ],
    "performance-tuner": [
      "How do I reduce LLM latency?",
      "What's causing slow API responses?",
      "How do I optimize throughput?",
    ],
    "data-scientist": [
      "How do I prepare data for ML models?",
      "What statistical tests should I use?",
      "How do I detect and handle data bias?",
    ],
    "vector-db-expert": [
      "Should I use vector DBs or traditional DBs?",
      "How do I optimize vector search?",
      "What's the best vector embedding dimension?",
    ],
    "llm-architect": [
      "How do I design an LLM-based application?",
      "What architecture scales to millions of users?",
      "How do I choose between APIs and self-hosted?",
    ],
    // Frontend & UI Agents
    "multimodal-expert": [
      "How do I build a multimodal AI system?",
      "Combine vision and text understanding",
      "What models support multimodal input?",
    ],
    "react-expert": [
      "How do I optimize React component performance?",
      "What's the best way to manage React state?",
      "How do I debug React rendering issues?",
    ],
    "ui-designer": [
      "Design a modern dashboard for AI applications",
      "What's the best color scheme for accessibility?",
      "How do I create a responsive mobile layout?",
    ],
    "tailwind-expert": [
      "Build a beautiful Tailwind component",
      "How do I create custom Tailwind themes?",
      "What's the best way to organize Tailwind classes?",
    ],
    "animations-expert": [
      "Create smooth entrance animations with Framer Motion",
      "How do I animate between page transitions?",
      "Build a scroll-triggered animation effect",
    ],
    "accessible-dev": [
      "How do I make my app WCAG 2.1 compliant?",
      "What are the best practices for keyboard navigation?",
      "How do I test accessibility?",
    ],
    "state-management": [
      "Should I use Redux, Zustand, or Context?",
      "How do I handle complex state logic?",
      "What's the best way to persist state?",
    ],
    "performance-frontend": [
      "How do I reduce bundle size?",
      "What's causing slow page loads?",
      "How do I implement code splitting?",
    ],
    "testing-frontend": [
      "How do I write effective React tests?",
      "What's the difference between unit and E2E tests?",
      "How do I test user interactions?",
    ],
    "responsive-design": [
      "Design a responsive layout for mobile and desktop",
      "What breakpoints should I use?",
      "How do I test responsive design?",
    ],
    "component-library": [
      "How do I build a reusable component library?",
      "What's the best structure for component documentation?",
      "How do I version a component library?",
    ],
    "forms-expert": [
      "How do I build accessible forms?",
      "What's the best way to validate form inputs?",
      "How do I handle file uploads?",
    ],
    "data-viz-expert": [
      "Recommend a charting library for my use case",
      "How do I create interactive data visualizations?",
      "What's the best way to visualize large datasets?",
    ],
    // Backend Agents
    "nodejs-expert": [
      "Build a scalable Node.js API",
      "How do I handle errors properly in Node?",
      "What's the best way to structure a Node project?",
    ],
    "fastapi-expert": [
      "Build a FastAPI endpoint with validation",
      "How do I add authentication to FastAPI?",
      "What's the best way to handle async operations?",
    ],
    "database-architect": [
      "Design a database schema for my use case",
      "When should I use SQL vs NoSQL?",
      "How do I optimize database queries?",
    ],
    "api-designer": [
      "Design a RESTful API that scales",
      "Should I use REST or GraphQL?",
      "How do I version my API?",
    ],
    "auth-expert": [
      "Implement JWT authentication securely",
      "How do I prevent account takeover?",
      "What's the best way to handle OAuth?",
    ],
    "caching-expert": [
      "How do I implement effective caching?",
      "Redis vs Memcached - which should I use?",
      "How do I invalidate cache properly?",
    ],
    "message-queue-expert": [
      "When should I use message queues?",
      "RabbitMQ vs Kafka vs Redis - which is best?",
      "How do I handle message processing failures?",
    ],
    "search-expert": [
      "How do I build a search engine?",
      "Elasticsearch vs Meilisearch - which is better?",
      "How do I optimize search performance?",
    ],
    "microservices-architect": [
      "How do I design a microservices architecture?",
      "How do I handle communication between services?",
      "What are the pitfalls of microservices?",
    ],
    "realtime-expert": [
      "Build a real-time chat system",
      "WebSockets vs Server-Sent Events?",
      "How do I scale real-time systems?",
    ],
    "file-storage-expert": [
      "Which file storage service should I use?",
      "How do I handle large file uploads?",
      "What's the best way to optimize storage costs?",
    ],
    // DevOps & Infrastructure
    "docker-expert": [
      "Write a production-ready Dockerfile",
      "How do I optimize Docker image size?",
      "Best practices for Docker multi-stage builds?",
    ],
    "kubernetes-expert": [
      "How do I deploy to Kubernetes?",
      "What's the best way to manage secrets?",
      "How do I scale Kubernetes services?",
    ],
    "terraform-expert": [
      "Write Infrastructure as Code with Terraform",
      "How do I manage Terraform state?",
      "What's the best way to organize Terraform modules?",
    ],
    "cicd-expert": [
      "Build a CI/CD pipeline with GitHub Actions",
      "How do I automate testing in CI?",
      "What's the best way to handle deployments?",
    ],
    "monitoring-expert": [
      "Set up comprehensive system monitoring",
      "How do I create useful alerts?",
      "What metrics should I track?",
    ],
    "networking-expert": [
      "How do I diagnose network issues?",
      "What's the best way to optimize network latency?",
      "How do I design a secure network?",
    ],
    "cloud-expert": [
      "Which cloud provider is right for me?",
      "How do I architect for cloud scalability?",
      "What are best practices for cloud cost optimization?",
    ],
    "backup-recovery": [
      "Design a disaster recovery plan",
      "How do I test backup restoration?",
      "What's the RPO and RTO for my system?",
    ],
    "security-devops": [
      "How do I scan for vulnerabilities in CI/CD?",
      "What's the best way to manage secrets?",
      "How do I implement infrastructure security?",
    ],
    "scaling-expert": [
      "How do I scale my application horizontally?",
      "What's the bottleneck in my system?",
      "How do I handle database scaling?",
    ],
    // Business & Product
    "product-manager": [
      "Help me write a product specification",
      "How do I prioritize features?",
      "What's the best go-to-market strategy?",
    ],
    "business-analyst": [
      "Analyze market opportunities for AI",
      "What are the key business metrics I should track?",
      "How do I measure product success?",
    ],
    "growth-hacker": [
      "Generate viral growth ideas for my product",
      "How do I reduce customer churn?",
      "What acquisition channels work best?",
    ],
    "content-strategist": [
      "Create a content calendar for Q2",
      "How do I measure content performance?",
      "What topics should I focus on?",
    ],
    "saas-expert": [
      "How do I price my SaaS product?",
      "What's a good SaaS unit economics?",
      "How do I reduce churn?",
    ],
    // Specialized Domains
    "blockchain-expert": [
      "How do I build a smart contract?",
      "What blockchain should I use?",
      "How do I ensure smart contract security?",
    ],
    "robotics-expert": [
      "How do I add AI to a robotics project?",
      "What sensors should I use?",
      "How do I process sensor data in real-time?",
    ],
    "game-developer": [
      "How do I add AI opponents to my game?",
      "Best practices for game performance?",
      "How do I create engaging game mechanics?",
    ],
    "mobile-app-expert": [
      "Should I build native or cross-platform?",
      "How do I optimize mobile app performance?",
      "Best practices for mobile UX?",
    ],
    "iot-expert": [
      "How do I build an IoT system?",
      "What's the best edge computing approach?",
      "How do I handle IoT data at scale?",
    ],
    "quantum-expert": [
      "How do I get started with quantum computing?",
      "What problems can quantum solve?",
      "Best resources for learning quantum?",
    ],
    "bioinformatics-expert": [
      "How do I analyze genomic data?",
      "What machine learning methods work for biology?",
      "How do I handle biological data privacy?",
    ],
    "climate-expert": [
      "How can AI help address climate change?",
      "What climate data should I analyze?",
      "How do I build climate prediction models?",
    ],
    "financial-expert": [
      "How do I build a stock prediction model?",
      "What's the best way to forecast market trends?",
      "How do I manage financial risk?",
    ],
    "healthcare-ai": [
      "How do I implement medical AI responsibly?",
      "What regulatory requirements should I know?",
      "How do I ensure healthcare AI accuracy?",
    ],
    // Advanced Research & Techniques
    "ai-safety-expert": [
      "How do I prevent AI alignment issues?",
      "What are red teaming techniques?",
      "How do I audit AI systems for safety?",
    ],
    "neural-network-architect": [
      "How do I design an efficient architecture?",
      "What's the best way to prune networks?",
      "How do I quantize models?",
    ],
    "synthetic-data-expert": [
      "How do I generate synthetic training data?",
      "How do I ensure synthetic data quality?",
      "What are privacy considerations?",
    ],
    "edge-ai-expert": [
      "How do I deploy models on edge devices?",
      "What's the best way to optimize for latency?",
      "How do I handle resource constraints?",
    ],
    "federated-learning-expert": [
      "How do I implement federated learning?",
      "What are privacy guarantees?",
      "How do I handle communication efficiency?",
    ],
    "causal-inference-expert": [
      "How do I discover causal relationships?",
      "What methods should I use for causal inference?",
      "How do I estimate treatment effects?",
    ],
    "knowledge-graph-builder": [
      "How do I build a knowledge graph?",
      "What tools should I use?",
      "How do I query knowledge graphs?",
    ],
    "explainability-expert": [
      "How do I explain black-box models?",
      "What's SHAP and when should I use it?",
      "How do I visualize model decisions?",
    ],
    "reinforcement-learning-expert": [
      "How do I get started with RL?",
      "What problem is RL best for?",
      "How do I train RL agents?",
    ],
    "transfer-learning-expert": [
      "When should I use transfer learning?",
      "How do I fine-tune pre-trained models?",
      "What's domain adaptation?",
    ],
    "time-series-expert": [
      "How do I forecast time series data?",
      "What's the best model for sequences?",
      "How do I detect anomalies in time series?",
    ],
    "nlp-specialist": [
      "How do I build an NLP pipeline?",
      "Best practices for text preprocessing?",
      "How do I handle multiple languages?",
    ],
    "computer-vision-specialist": [
      "How do I build a vision model?",
      "What's the best approach for image classification?",
      "How do I handle large images?",
    ],
    "graph-neural-network-expert": [
      "How do I use GNNs for my problem?",
      "What's message passing?",
      "How do I handle heterogeneous graphs?",
    ],
    "recommendation-system-expert": [
      "How do I build a recommendation engine?",
      "How do I handle the cold start problem?",
      "What's collaborative filtering?",
    ],
    "anomaly-detection-expert": [
      "How do I detect anomalies?",
      "What's the best algorithm for my use case?",
      "How do I reduce false positives?",
    ],
    "model-compression-expert": [
      "How do I compress my model?",
      "What's the best compression technique?",
      "How much quality do I lose?",
    ],
    "active-learning-expert": [
      "How do I implement active learning?",
      "What's the best query strategy?",
      "How do I maximize label efficiency?",
    ],
    "meta-learning-expert": [
      "How do I implement meta-learning?",
      "What's MAML?",
      "How do I train few-shot learners?",
    ],
    "continual-learning-expert": [
      "How do I prevent catastrophic forgetting?",
      "What's the best continual learning approach?",
      "How do I balance plasticity and stability?",
    ],
    // Creative & Media
    "creative-writer": [
      "Help me write a compelling story opening",
      "Generate dialogue between two characters",
      "Create an interesting plot twist",
    ],
    "music-producer": [
      "How do I compose a chord progression?",
      "What's the best structure for a song?",
      "How do I arrange for multiple instruments?",
    ],
    "visual-artist": [
      "Describe a color palette for modern design",
      "How do I compose a balanced visual layout?",
      "What principles make effective photography?",
    ],
    "game-narrative-designer": [
      "Design a quest with branching outcomes",
      "Create compelling character backstories",
      "How do I build emotional connections in games?",
    ],
    "vfx-specialist": [
      "Create a particle effect concept",
      "How do I simulate realistic physics?",
      "What software should I use?",
    ],
    "3d-modeler": [
      "How do I model a character efficiently?",
      "What's the best way to texture 3D models?",
      "How do I optimize models for games?",
    ],
    "ux-researcher": [
      "Design a user research study",
      "How do I analyze user feedback?",
      "What usability issues should I look for?",
    ],
    "brand-strategist": [
      "Help me define my brand positioning",
      "Create a brand voice and messaging",
      "How do I differentiate from competitors?",
    ],
    "content-creator": [
      "Generate viral social media content ideas",
      "What trending topics should I cover?",
      "How do I optimize for platform algorithms?",
    ],
    "copywriter": [
      "Write compelling ad copy for my product",
      "Create subject lines that increase open rates",
      "How do I write persuasive product descriptions?",
    ],
    "podcast-producer": [
      "Structure an episode with great pacing",
      "How do I conduct engaging interviews?",
      "What's the best way to grow podcast audience?",
    ],
    "video-editor": [
      "How do I edit video for professional quality?",
      "What's the best color grading approach?",
      "How do I optimize videos for different platforms?",
    ],
    "graphic-designer": [
      "Design a modern brand identity system",
      "What typography pairs work well together?",
      "How do I create an icon set?",
    ],
    "motion-designer": [
      "Create smooth UI animations with easing curves",
      "How do I animate characters naturally?",
      "What's the best timing for motion graphics?",
    ],
    "sound-designer": [
      "How do I design sound effects for games?",
      "What's the best way to mix audio?",
      "How do I create immersive spatial audio?",
    ],
    "legal-tech-expert": [
      "How do I use AI for contract analysis?",
      "What are AI compliance applications?",
      "How do I implement legal document automation?",
    ],
    "agri-tech-expert": [
      "How do I predict crop yield?",
      "What AI tools help with pest detection?",
      "How do I optimize irrigation with AI?",
    ],
    "education-ai": [
      "How do I build personalized learning paths?",
      "What adaptive learning systems should I use?",
      "How do I measure learning outcomes?",
    ],
    "energy-expert": [
      "How do I forecast energy demand?",
      "What's the best way to optimize power grids?",
      "How do I integrate renewables efficiently?",
    ],
    "transport-expert": [
      "How do I optimize delivery routes?",
      "What's the best way to manage fleet logistics?",
      "How do I predict traffic patterns?",
    ],
    "retail-expert": [
      "How do I predict customer demand?",
      "What's the best way to optimize inventory?",
      "How do I personalize product recommendations?",
    ],
    "manufacturing-expert": [
      "How do I predict equipment failures?",
      "What's the best way to optimize production?",
      "How do I detect defects automatically?",
    ],
    "real-estate-ai": [
      "How do I predict property prices?",
      "What's the best way to analyze real estate markets?",
      "How do I identify investment opportunities?",
    ],
    "insurance-ai": [
      "How do I assess risk accurately?",
      "What's the best way to detect fraud?",
      "How do I automate claims processing?",
    ],
    "hr-ai": [
      "How do I improve candidate screening?",
      "What's the best way to predict employee churn?",
      "How do I identify high-potential talent?",
    ],
    "legal-research-ai": [
      "How do I search legal precedents efficiently?",
      "What's the best way to analyze case law?",
      "How do I automate legal document review?",
    ],
    "environmental-ai": [
      "How do I monitor deforestation?",
      "What's the best way to track species populations?",
      "How do I predict environmental disasters?",
    ],
    "urban-planning-ai": [
      "How do I optimize city traffic?",
      "What's the best way to plan smart cities?",
      "How do I improve urban resource allocation?",
    ],
    "paper-reviewer": [
      "What makes a strong research paper?",
      "How do I provide constructive feedback?",
      "What should I look for in methodology?",
    ],
    "lit-review-expert": [
      "How do I structure a literature review?",
      "What's the best way to identify research gaps?",
      "How do I synthesize research findings?",
    ],
    "experimental-design-expert": [
      "How do I design a rigorous experiment?",
      "What's the best way to control for bias?",
      "How do I calculate sample size?",
    ],
    "thesis-advisor": [
      "How do I structure my thesis effectively?",
      "What makes a strong research contribution?",
      "How do I prepare for thesis defense?",
    ],
    "startup-advisor": [
      "How do I validate my business idea?",
      "What's the best way to raise funding?",
      "How do I scale from startup to scale-up?",
    ],
    "venture-capitalist": [
      "How do I evaluate startup potential?",
      "What's a fair valuation for my startup?",
      "How do I build a strong investment portfolio?",
    ],
    "market-analyst": [
      "How do I analyze market trends?",
      "What's the competitive landscape like?",
      "How do I identify market opportunities?",
    ],
  };
  return prompts[agentId] ?? [];
}
