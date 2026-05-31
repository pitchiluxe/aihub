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
  Zap, Brain, Pen, Code, Microscope, Newspaper, RotateCcw,
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

      if (!res.ok) throw new Error("Chat request failed");
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
      toast.error("Failed to get response. Please try again.");
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
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="AI Agents Hub" description="AI specialist agents for every task" />
      <div className="flex-1 p-6 space-y-6">
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
  };
  return prompts[agentId] ?? [];
}
